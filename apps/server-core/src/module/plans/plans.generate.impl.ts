import { Config, Effect, Redacted } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http";
import { Auth } from "../../platform/auth/auth.contract";
import { PlansService } from "./plans.service";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const OPENAI_PLAN_MODEL = "gpt-4.1-mini";

const OpenAiApiKey = Config.redacted("OPENAI_API_KEY");

type UploadedScreenshot = {
  readonly key: string;
  readonly url: string;
};

type GeneratedPlan = {
  readonly intent?: string;
  readonly title?: string;
  readonly exploration?: ReadonlyArray<{
    readonly screenshot?: string;
    readonly reason?: string;
  }>;
};

type OpenAiResponse = {
  readonly output_text?: string;
  readonly output?: ReadonlyArray<{
    readonly content?: ReadonlyArray<{
      readonly text?: string;
      readonly type?: string;
    }>;
  }>;
};

const json = (value: unknown) => {
  // oxlint-disable-next-line effect-local/no-json-parse -- OpenAI HTTP APIs require JSON request bodies.
  return JSON.stringify(value);
};

const planInstructions = `Create a concise product workflow plan from the user's intent and screenshots.
Return only JSON in this exact shape:
{"title":"...","intent":"...","exploration":[{"screenshot":"...","reason":"..."}]}
The title must be terse, descriptive, and at most 5 words. It should capture the user's intent for display in a compact plan selector.
Treat the screenshots as an ordered storyboard. Return exactly one exploration item per provided screenshot, in the exact same order. Do not reorder, skip, duplicate, or infer screenshots that were not provided. Use the screenshot value from the screenshot label exactly. Each exploration item should explain what that specific screenshot shows and why it matters for the workflow step.`;

export const PlansGenerateLive = HttpRouter.use((router) =>
  Effect.gen(function* () {
    const auth = yield* Auth;
    const service = yield* PlansService;

    const generate = Effect.fn("PlansGenerateLive.generate")(function* (
      request: HttpServerRequest.HttpServerRequest,
    ) {
      const apiKey = yield* OpenAiApiKey;
      const headers = new Headers(request.headers as Record<string, string>);
      const session = yield* auth
        .resolveSession(headers)
        .pipe(Effect.catchTags({ ErrorAuth: Effect.die }));
      if (!session.user || !session.session) {
        return HttpServerResponse.fromWeb(
          Response.json({ error: "Authentication required" }, { status: 401 }),
        );
      }

      const webRequest = yield* HttpServerRequest.toWeb(request);
      const formData = yield* Effect.tryPromise({
        try: () => webRequest.formData(),
        catch: (cause) => cause,
      });
      const intentValue = formData.get("intent");
      const sessionIdValue = formData.get("sessionId");
      const intent = typeof intentValue === "string" ? intentValue.trim() : "";
      const sessionId = typeof sessionIdValue === "string" ? sessionIdValue.trim() : "";
      const screenshots = formData.getAll("screenshots").flatMap(parseScreenshot);

      if (intent.length === 0) {
        return HttpServerResponse.fromWeb(
          Response.json({ error: "Intent is required" }, { status: 400 }),
        );
      }
      if (sessionId.length === 0) {
        return HttpServerResponse.fromWeb(
          Response.json({ error: "Session id is required" }, { status: 400 }),
        );
      }
      const response = yield* Effect.tryPromise({
        try: () =>
          fetch(OPENAI_RESPONSES_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${Redacted.value(apiKey)}`,
              "Content-Type": "application/json",
            },
            body: json({
              model: OPENAI_PLAN_MODEL,
              input: [
                {
                  role: "user",
                  content: [
                    { type: "input_text", text: `${planInstructions}\n\nIntent: ${intent}` },
                    ...screenshots.flatMap((screenshot, index) => [
                      {
                        type: "input_text" as const,
                        text: `Screenshot ${index + 1} value: ${screenshot.key}`,
                      },
                      {
                        type: "input_image" as const,
                        image_url: screenshot.url,
                      },
                    ]),
                  ],
                },
              ],
              text: { format: { type: "json_object" } },
            }),
          }),
        catch: (cause) => cause,
      });

      if (!response.ok) {
        const message = yield* Effect.promise(() => response.text());
        yield* Effect.logWarning(`OpenAI plan generation failed: ${message}`);
        return HttpServerResponse.fromWeb(
          Response.json({ error: "Plan generation failed" }, { status: response.status }),
        );
      }

      const openai = yield* Effect.tryPromise({
        try: () => response.json() as Promise<OpenAiResponse>,
        catch: (cause) => cause,
      });
      const outputText = extractOutputText(openai);
      if (outputText.length === 0) {
        yield* Effect.logWarning("OpenAI plan generation returned no text output");
        return HttpServerResponse.fromWeb(
          Response.json({ error: "Plan generation returned no output" }, { status: 502 }),
        );
      }

      const generated = yield* decodeGeneratedPlan(outputText).pipe(
        Effect.catch(() =>
          Effect.succeed({
            intent,
            title: createFallbackTitle(intent),
            exploration: screenshots.map((_, index) => ({
              reason: `Demonstrate workflow step ${index + 1}.`,
            })),
          } satisfies GeneratedPlan),
        ),
      );
      const exploration = normalizeExploration(generated, screenshots);
      const plan = yield* service
        .create({
          sessionId,
          userId: session.user.id,
          intent: generated.intent?.trim() || intent,
          title: normalizeTitle(generated.title, intent),
          exploration,
          links: createSequentialLinks(exploration.length),
        })
        .pipe(Effect.catchTags({ ErrorDb: Effect.die }));

      return HttpServerResponse.fromWeb(Response.json({ plan }));
    });

    yield* router.add("POST", "/api/plans/generate", generate);
  }),
);

function parseScreenshot(value: unknown): ReadonlyArray<UploadedScreenshot> {
  if (typeof value !== "string") {
    return [];
  }
  const [key, url] = value.split("\t");
  return key && url ? [{ key, url }] : [];
}

function createSequentialLinks(count: number) {
  return Array.from({ length: Math.max(0, count - 1) }, (_, index) => ({
    from: `step-${index + 1}`,
    to: `step-${index + 2}`,
  }));
}

function decodeGeneratedPlan(text: string) {
  return Effect.tryPromise({
    try: () => new Response(text).json() as Promise<GeneratedPlan>,
    catch: (cause) => cause,
  });
}

function extractOutputText(response: OpenAiResponse) {
  if (typeof response.output_text === "string") {
    return response.output_text.trim();
  }

  return (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .join("\n")
    .trim();
}

function normalizeExploration(plan: GeneratedPlan, screenshots: ReadonlyArray<UploadedScreenshot>) {
  const items = plan.exploration ?? [];
  if (screenshots.length === 0) {
    return items.map((item, index) => ({
      screenshot: "",
      reason: item.reason?.trim() || `Demonstrate workflow step ${index + 1}.`,
    }));
  }

  return screenshots.map((screenshot, index) => ({
    screenshot: screenshot.key,
    reason:
      items[index]?.reason?.trim() ||
      `Use screenshot ${index + 1} to demonstrate this step in the workflow.`,
  }));
}

function normalizeTitle(title: string | undefined, intent: string) {
  const trimmed = title?.trim();
  return trimmed && trimmed.length > 0 ? trimmed.slice(0, 64) : createFallbackTitle(intent);
}

function createFallbackTitle(intent: string) {
  const words = intent.trim().split(/\s+/).filter(Boolean).slice(0, 5).join(" ");
  return words.length > 0 ? words.slice(0, 64) : "Untitled plan";
}
