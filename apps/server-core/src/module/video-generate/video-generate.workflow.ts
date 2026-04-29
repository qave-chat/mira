import { Effect, Option, Redacted, Schema } from "effect";
import { Workflow } from "effect/unstable/workflow";
import { R2 } from "../../platform/r2.contract";
import { VideoGenerateRenderer } from "./video-generate.renderer";
import { VideoGenerateRepo } from "./video-generate.repo";
import { VideoGenerateWorkflowInput, VideoGenerateWorkflowResult } from "./video-generate.schema";

const PHOTO_URL_EXPIRES_IN_SECONDS = 60 * 60;
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_VIDEO_MODEL = "gpt-5.5";
const PAINTING_BACKGROUND_URLS = [
  "https://unsplash.com/photos/VsnDYMWollM/download?force=true&w=1920",
  "https://unsplash.com/photos/8wcoY3wcbL0/download?force=true&w=1920",
] as const;

const encodeJson = (value: unknown) => {
  // oxlint-disable-next-line effect-local/no-json-parse -- OpenAI HTTP APIs require JSON request bodies.
  return JSON.stringify(value);
};

type CreativeDirection = {
  readonly sceneType: "workflow" | "feature" | "result" | "share";
  readonly motion: "push-in" | "pan" | "spotlight" | "hold";
  readonly callout: "ring" | "arrow" | "pulse" | "magnify";
  readonly calloutLabel: string;
  readonly body?: string;
  readonly cta?: string;
  readonly headline: string;
};

type CreativePackage = {
  readonly title: string;
  readonly subtitle: string;
  readonly scenes: ReadonlyArray<CreativeDirection>;
};

type OpenAiResponse = {
  readonly output_text?: string;
  readonly output?: ReadonlyArray<{
    readonly type?: string;
    readonly result?: string;
  }>;
};

export class ErrorVideoGenerateFailed extends Schema.TaggedErrorClass<ErrorVideoGenerateFailed>()(
  "ErrorVideoGenerateFailed",
  { message: Schema.String },
) {}

export const VideoGenerateWorkflow = Workflow.make({
  name: "VideoGenerateWorkflow",
  payload: VideoGenerateWorkflowInput,
  success: VideoGenerateWorkflowResult,
  error: ErrorVideoGenerateFailed,
  idempotencyKey: ({ id }) => id,
});

export const VideoGenerateWorkflowLive = VideoGenerateWorkflow.toLayer((input) =>
  Effect.gen(function* () {
    const r2 = yield* R2;
    const renderer = yield* VideoGenerateRenderer;
    const repo = yield* VideoGenerateRepo;
    const openAiApiKey = process.env.OPENAI_API_KEY
      ? Option.some(Redacted.make(process.env.OPENAI_API_KEY))
      : Option.none();
    yield* Effect.logInfo("video-generate.workflow.started", {
      id: input.id,
      sceneCount: input.scenes.length,
    });
    yield* repo
      .updateById(input.id, {
        phase: "signing-photos",
        message: "Preparing source images",
        progress: 15,
      })
      .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
    const scenes = yield* Effect.forEach(input.scenes, (scene, index) =>
      Effect.gen(function* () {
        const imageUrl = yield* r2.signGetObject({
          key: scene.screenshot,
          expiresInSeconds: PHOTO_URL_EXPIRES_IN_SECONDS,
        });
        return { id: scene.id, imageUrl, reason: scene.reason, index };
      }),
    ).pipe(Effect.mapError((error) => new ErrorVideoGenerateFailed({ message: error.message })));
    const creative = yield* generateCreativePackage(openAiApiKey, input.prompt, scenes).pipe(
      Effect.catch((error: unknown) =>
        Effect.logWarning("video-generate.creative-direction.failed", {
          error: String(error),
        }).pipe(Effect.as(createFallbackCreativePackage(input.prompt, scenes))),
      ),
    );
    const directedScenes = scenes.map((scene, index) => ({
      ...scene,
      direction: creative.scenes[index],
    }));
    yield* Effect.logInfo("video-generate.photos.signed", { id: input.id });
    yield* Effect.logInfo("video-generate.hero-image.disabled", { id: input.id });
    yield* Effect.logInfo("video-generate.background.painting", {
      id: input.id,
      count: PAINTING_BACKGROUND_URLS.length,
    });
    yield* repo
      .updateById(input.id, {
        phase: "rendering",
        message: "Rendering video",
        progress: 35,
      })
      .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
    const rendered = yield* renderer
      .render({
        id: input.id,
        title: creative.title,
        subtitle: creative.subtitle,
        backgroundImageUrls: PAINTING_BACKGROUND_URLS,
        scenes: directedScenes,
      })
      .pipe(Effect.mapError((error) => new ErrorVideoGenerateFailed({ message: error.message })));
    yield* Effect.logInfo("video-generate.render.completed", {
      id: input.id,
      bytes: rendered.byteLength,
    });
    const videoKey = `video-generate/renders/${input.id}.mp4`;
    yield* repo
      .updateById(input.id, {
        phase: "uploading",
        message: "Saving rendered video",
        progress: 85,
      })
      .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
    yield* r2
      .putObject({ key: videoKey, body: rendered, contentType: "video/mp4" })
      .pipe(Effect.mapError((error) => new ErrorVideoGenerateFailed({ message: error.message })));
    yield* repo
      .updateById(input.id, {
        status: "succeeded",
        phase: "succeeded",
        message: "Video ready",
        progress: 100,
        videoKey,
      })
      .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
    yield* Effect.logInfo("video-generate.r2.uploaded", { id: input.id, videoKey });
    return { videoKey, contentType: "video/mp4" as const };
  }),
);

function generateCreativePackage(
  apiKey: Option.Option<Redacted.Redacted<string>>,
  title: string,
  scenes: ReadonlyArray<{ readonly reason: string; readonly imageUrl: string }>,
) {
  if (Option.isNone(apiKey)) {
    return Effect.succeed(createFallbackCreativePackage(title, scenes));
  }

  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      try: () =>
        fetch(OPENAI_RESPONSES_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Redacted.value(apiKey.value)}`,
            "Content-Type": "application/json",
          },
          body: encodeJson({
            model: OPENAI_VIDEO_MODEL,
            input: [
              {
                role: "user",
                content: [
                  {
                    type: "input_text",
                    text: creativeDirectionPrompt(title, scenes),
                  },
                  ...scenes.map((scene) => ({ type: "input_image", image_url: scene.imageUrl })),
                ],
              },
            ],
            text: { format: { type: "json_object" } },
          }),
        }),
      catch: (cause) => cause,
    });
    if (!response.ok) {
      return createFallbackCreativePackage(title, scenes);
    }
    const openai: OpenAiResponse = yield* Effect.tryPromise({
      try: () => response.json() as Promise<{ readonly output_text?: string }>,
      catch: (cause) => cause,
    });
    const text = openai.output_text?.trim() ?? "";
    if (text.length === 0) {
      return createFallbackCreativePackage(title, scenes);
    }
    const parsed = yield* Effect.tryPromise({
      try: () => new Response(text).json() as Promise<unknown>,
      catch: (cause) => cause,
    });
    return parseCreativeDirectionResponse(parsed, title, scenes);
  });
}

function parseCreativeDirectionResponse(
  value: unknown,
  fallbackTitle: string,
  sourceScenes: ReadonlyArray<{ readonly reason: string }>,
) {
  if (!isRecord(value) || !Array.isArray(value.scenes)) {
    return createFallbackCreativePackage(fallbackTitle, sourceScenes);
  }

  const scenes = value.scenes.flatMap((scene): ReadonlyArray<CreativeDirection> => {
    if (!isRecord(scene)) {
      return [];
    }
    if (
      !isSceneType(scene.sceneType) ||
      !isMotion(scene.motion) ||
      !isCallout(scene.callout) ||
      typeof scene.calloutLabel !== "string" ||
      typeof scene.headline !== "string"
    ) {
      return [];
    }

    const direction: CreativeDirection = {
      sceneType: scene.sceneType,
      motion: scene.motion,
      callout: scene.callout,
      calloutLabel: scene.calloutLabel,
      headline: sanitizeHeadline(scene.headline),
    };
    const body = typeof scene.body === "string" ? sanitizeSentence(scene.body) : undefined;
    const cta = typeof scene.cta === "string" ? sanitizeCta(scene.cta) : undefined;
    return [{ ...direction, ...(body ? { body } : {}), ...(cta ? { cta } : {}) }];
  });

  if (scenes.length !== sourceScenes.length) {
    return createFallbackCreativePackage(fallbackTitle, sourceScenes);
  }

  return {
    title:
      typeof value.title === "string" && value.title.trim()
        ? sanitizeLaunchTitle(value.title)
        : summarizeTitle(fallbackTitle),
    subtitle:
      typeof value.subtitle === "string" && value.subtitle.trim()
        ? sanitizeSentence(value.subtitle)
        : "A fast walkthrough of the moments that move the product forward.",
    scenes,
  };
}

function createFallbackCreativePackage(
  title: string,
  scenes: ReadonlyArray<{ readonly reason: string }>,
): CreativePackage {
  return {
    title: summarizeTitle(title),
    subtitle: summarizeSubtitle(scenes),
    scenes: scenes.map((scene, index) =>
      inferFallbackDirection(scene.reason, index, scenes.length),
    ),
  };
}

function summarizeTitle(title: string) {
  const banned =
    /screenshot|give me|working|create|demo video|walkthrough video|i have a pitch|basically/i;
  const cleaned = title
    .replace(/["']/g, "")
    .replace(/^create\s+(a|an)?\s*/i, "")
    .replace(/\b(short|nice|demo|video|walkthrough|product|screenshot|working)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0 || banned.test(cleaned)) {
    return "Product Workflow Launch";
  }
  return toTitleCase(cleaned.split(" ").slice(0, 5).join(" "));
}

function sanitizeLaunchTitle(value: string) {
  const banned =
    /screenshot|give me|working|create|demo video|walkthrough video|i have a pitch|basically/i;
  const cleaned = value
    .replace(/["']/g, "")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0 || banned.test(cleaned)) {
    return summarizeTitle(cleaned);
  }
  return toTitleCase(cleaned.split(" ").slice(0, 5).join(" "));
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function sanitizeHeadline(value: string) {
  const cleaned = value
    .replace(/["']/g, "")
    .replace(/\b(workflow moment|product moment|screenshot)\b/gi, "")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0) return "Guide The Next Step";
  return cleaned.split(" ").slice(0, 7).join(" ");
}

function sanitizeSentence(value: string) {
  const cleaned = value
    .replace(/\b(workflow moment|mira autocomplete|screenshot)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0)
    return "A focused look at the selected screen and the action it supports.";
  const sentence = cleaned.split(" ").slice(0, 18).join(" ");
  return sentence.endsWith(".") ? sentence : `${sentence}.`;
}

function sanitizeCta(value: string) {
  const cleaned = value
    .replace(/[-→>]+$/g, "")
    .replace(/\b(workflow moment|mira autocomplete|screenshot)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0) return "Explore The Flow";
  return cleaned.split(" ").slice(0, 4).join(" ");
}

function summarizeSubtitle(scenes: ReadonlyArray<{ readonly reason: string }>) {
  if (scenes.some((scene) => scene.reason.toLowerCase().includes("share"))) {
    return "From first action to share-ready output in one guided product story.";
  }
  if (scenes.some((scene) => scene.reason.toLowerCase().includes("generate"))) {
    return "A focused release flow from setup to generated result.";
  }
  return "A polished walkthrough of the workflow moments that matter.";
}

function inferFallbackDirection(reason: string, index: number, total: number): CreativeDirection {
  const text = reason.toLowerCase();
  const sceneType: CreativeDirection["sceneType"] = text.includes("share")
    ? "share"
    : text.includes("completed") || text.includes("ready") || index === total - 1
      ? "result"
      : text.includes("generate") || text.includes("option") || text.includes("button")
        ? "feature"
        : "workflow";
  return {
    sceneType,
    motion: sceneType === "share" ? "pan" : sceneType === "result" ? "spotlight" : "push-in",
    callout:
      sceneType === "share"
        ? "arrow"
        : sceneType === "result"
          ? "pulse"
          : sceneType === "feature"
            ? "ring"
            : "magnify",
    calloutLabel:
      sceneType === "share"
        ? "Shared"
        : sceneType === "result"
          ? "Result"
          : sceneType === "feature"
            ? "Action"
            : "Selected",
    body: sanitizeSentence(reason),
    cta:
      sceneType === "share"
        ? "Share The Story"
        : sceneType === "result"
          ? "Review The Result"
          : "Explore The Flow",
    headline:
      sceneType === "share"
        ? "Publish the story"
        : sceneType === "result"
          ? "Show the finished experience"
          : sceneType === "feature"
            ? "Highlight the action"
            : index === 0
              ? "Open on the product moment"
              : "Guide the next step",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSceneType(value: unknown): value is CreativeDirection["sceneType"] {
  return value === "workflow" || value === "feature" || value === "result" || value === "share";
}

function isMotion(value: unknown): value is CreativeDirection["motion"] {
  return value === "push-in" || value === "pan" || value === "spotlight" || value === "hold";
}

function isCallout(value: unknown): value is CreativeDirection["callout"] {
  return value === "ring" || value === "arrow" || value === "pulse" || value === "magnify";
}

function creativeDirectionPrompt(
  title: string,
  scenes: ReadonlyArray<{ readonly reason: string }>,
) {
  return `Interpret these app screenshots and write contextual copy for a polished product video.
Return only JSON: {"title":"context-aware title","subtitle":"one concise product-story sentence","scenes":[{"sceneType":"workflow|feature|result|share","motion":"push-in|pan|spotlight|hold","callout":"ring|arrow|pulse|magnify","calloutLabel":"short internal label","headline":"specific headline","body":"specific supporting sentence","cta":"short blue CTA"}]}
Title rules: 2 to 5 words, Title Case, no apostrophes, no "screenshot", no "give me", no raw prompt, no "I have a pitch", no vague "workflow moment" or "product moment". Infer what the interface is doing from the images and step reasons. Prefer concrete app copy like "Assess A New Company", "Review Company Signals", or "Complete The Assessment" when supported by context.
Scene copy rules: headlines are 3 to 7 words, bodies are under 18 words, CTAs are 2 to 4 words. Ground every line in the visible app state and step reason. Do not mention code, autocomplete, Cursor, or screenshots.
Use exactly ${scenes.length} scenes in the same order.
Original user request: ${title}
Steps:
${scenes.map((scene, index) => `${index + 1}. ${scene.reason}`).join("\n")}`;
}
