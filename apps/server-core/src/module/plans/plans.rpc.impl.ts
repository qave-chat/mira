import { Effect } from "effect";
import { requireCurrentRpcUserId } from "../../platform/auth/rpc-auth";
import { PlanRpcs } from "./plans.rpc.contract";
import { PlansService } from "./plans.service";

export const PlansLive = PlanRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlansService;
    return {
      PlanCreate: Effect.fn("Rpc.PlanCreate")(function* (input, { headers }) {
        const userId = yield* requireCurrentRpcUserId(headers);
        return yield* service
          .create({ ...input, userId })
          .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      PlanList: Effect.fn("Rpc.PlanList")(function* ({ sessionId }, { headers }) {
        const userId = yield* requireCurrentRpcUserId(headers);
        yield* Effect.annotateCurrentSpan({ "session.id": sessionId });
        return yield* service
          .list({ sessionId, userId })
          .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      PlanGet: Effect.fn("Rpc.PlanGet")(function* ({ id }, { headers }) {
        const userId = yield* requireCurrentRpcUserId(headers);
        yield* Effect.annotateCurrentSpan({ "plan.id": id });
        return yield* service.get({ id, userId }).pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
    };
  }),
);
