import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

const DependencyStatus = Schema.Literals(["ok", "down"]);

const ReadinessResponse = Schema.Struct({
  server: DependencyStatus,
});

const LivenessResponse = Schema.Struct({
  status: Schema.Literal("ok"),
});

export class HealthHttpGroup extends HttpApiGroup.make("health")
  .add(HttpApiEndpoint.get("live", "/health", { success: LivenessResponse }))
  .add(HttpApiEndpoint.get("ready", "/health/ready", { success: ReadinessResponse })) {}
