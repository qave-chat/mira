import { Config, Effect, Redacted } from "effect";
import { HttpRouter, HttpServerResponse } from "effect/unstable/http";

const OPENAI_REALTIME_SESSIONS_URL = "https://api.openai.com/v1/realtime/sessions";
const OPENAI_REALTIME_MODEL = "gpt-4o-realtime-preview";
const OPENAI_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";
const OPENAI_REALTIME_SESSION_BODY = `{
  "model":"${OPENAI_REALTIME_MODEL}",
  "modalities":["text"],
  "input_audio_transcription":{"model":"${OPENAI_TRANSCRIPTION_MODEL}"},
  "turn_detection":{"type":"server_vad"}
}`;

const OpenAiApiKey = Config.redacted("OPENAI_API_KEY");

export const AsrLive = HttpRouter.use((router) =>
  Effect.gen(function* () {
    const createRealtimeSession = Effect.fn("AsrLive.createRealtimeSession")(function* () {
      const apiKey = yield* OpenAiApiKey;
      const response = yield* Effect.tryPromise({
        try: () =>
          fetch(OPENAI_REALTIME_SESSIONS_URL, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${Redacted.value(apiKey)}`,
              "Content-Type": "application/json",
            },
            body: OPENAI_REALTIME_SESSION_BODY,
          }),
        catch: (cause) => cause,
      });

      if (!response.ok) {
        const message = yield* Effect.promise(() => response.text());
        yield* Effect.logWarning(`OpenAI Realtime session failed: ${message}`);
        return HttpServerResponse.fromWeb(
          Response.json({ error: "Realtime session failed" }, { status: response.status }),
        );
      }

      const result = yield* Effect.tryPromise({
        try: () => response.json() as Promise<unknown>,
        catch: (cause) => cause,
      });

      return HttpServerResponse.fromWeb(Response.json(result));
    });

    yield* router.add("POST", "/api/asr/realtime-session", createRealtimeSession);
  }),
);
