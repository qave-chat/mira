import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";

export class HealthCheck extends Rpc.make("HealthCheck", {
  success: Schema.Struct({
    status: Schema.Literal("ok"),
    timestamp: Schema.Number,
  }),
}) {}

export const HealthRpcs = RpcGroup.make(HealthCheck);
