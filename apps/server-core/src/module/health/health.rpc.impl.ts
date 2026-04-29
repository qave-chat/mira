import { Effect } from "effect";
import { HealthRpcs } from "./health.rpc.contract";

export const HealthLive = HealthRpcs.toLayer({
  HealthCheck: () => Effect.succeed({ status: "ok" as const, timestamp: Date.now() }),
});
