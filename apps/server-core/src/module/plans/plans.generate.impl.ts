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
  readonly exploration?: ReadonlyArray<{
    readonly screenshot?: string;
    readonly reason?: string;
  }>;
};

const json = (value: unknown) => {
  // oxlint-disable-next-line effect-local/no-json-parse -- OpenAI HTTP APIs require JSON request bodies.
  return JSON.stringify(value);
};

const planInstructions = `Create a concise product workflow plan from the user's intent and screenshots.
Return only JSON in this exact shape:
{"intent":"...","exploration":[{"screenshot":"...","reason":"..."}]}
Use the screenshot value from the provided screenshots exactly. Each exploration item should explain why that screenshot matters for the workflow step. Link the steps in natural workflow order.`;

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

      const webRequest = new Request(request.url, {
        body: request.source as never,
        headers,
        method: request.method,
      });
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
      if (screenshots.length === 0) {
        return HttpServerResponse.fromWeb(
          Response.json({ error: "At least one screenshot is required" }, { status: 400 }),
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
                    ...screenshots.map((screenshot, index) => ({
                      type: "input_text",
                      text: `Screenshot ${index + 1}: ${screenshot.url}`,
                    })),
                    ...screenshots.map((screenshot) => ({
                      type: "input_image",
                      image_url: screenshot.url,
                    })),
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
        try: () => response.json() as Promise<{ output_text?: string }>,
        catch: (cause) => cause,
      });
      const generated = yield* decodeGeneratedPlan(openai.output_text ?? "");
      const plan = yield* service
        .create({
          sessionId,
          userId: session.user.id,
          intent: generated.intent?.trim() || intent,
          exploration: normalizeExploration(generated, screenshots),
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

function decodeGeneratedPlan(text: string) {
  return Effect.tryPromise({
    try: () => new Response(text).json() as Promise<GeneratedPlan>,
    catch: (cause) => cause,
  });
}

function normalizeExploration(plan: GeneratedPlan, screenshots: ReadonlyArray<UploadedScreenshot>) {
  const items = plan.exploration ?? [];
  return screenshots.map((screenshot, index) => ({
    screenshot: screenshot.key,
    reason:
      items[index]?.reason?.trim() ||
      `Use screenshot ${index + 1} to demonstrate this step in the workflow.`,
  }));
}
