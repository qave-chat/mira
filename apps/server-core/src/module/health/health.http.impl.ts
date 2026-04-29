import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { HttpApiDef } from "../../platform/http.contract";

export const HealthHttpHandlers = HttpApiBuilder.group(HttpApiDef, "health", (handlers) =>
  Effect.succeed(
    handlers
      .handle("live", () => Effect.succeed({ status: "ok" as const }))
      .handle("ready", () => Effect.succeed({ server: "ok" as const })),
  ),
);
