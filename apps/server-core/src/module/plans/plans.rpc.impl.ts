import { Effect } from "effect";
import { PlanRpcs } from "./plans.rpc.contract";
import { PlansService } from "./plans.service";

export const PlansLive = PlanRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlansService;
    return {
      PlanCreate: Effect.fn("Rpc.PlanCreate")(function* (input) {
        return yield* service
          .create({ ...input, userId: "usr_test" })
          .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      PlanList: Effect.fn("Rpc.PlanList")(function* ({ sessionId }) {
        yield* Effect.annotateCurrentSpan({ "session.id": sessionId });
        return yield* service
          .list({ sessionId, userId: "usr_test" })
          .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      PlanGet: Effect.fn("Rpc.PlanGet")(function* ({ id }) {
        yield* Effect.annotateCurrentSpan({ "plan.id": id });
        return yield* service
          .get({ id, userId: "usr_test" })
          .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
    };
  }),
);
