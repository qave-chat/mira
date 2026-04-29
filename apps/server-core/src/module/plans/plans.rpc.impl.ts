import { Effect } from "effect";
import { requireCurrentRpcUserId } from "../../platform/auth/rpc-auth";
import { R2 } from "../../platform/r2.contract";
import type { Plan } from "./plans.schema";
import { PlanRpcs } from "./plans.rpc.contract";
import { PlansService } from "./plans.service";

const SCREENSHOT_URL_EXPIRES_SECONDS = 60 * 60;

export const PlansLive = PlanRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* PlansService;
    const r2 = yield* R2;
    const withScreenshotUrls = Effect.fn("PlansRpc.withScreenshotUrls")(function* (plan: Plan) {
      const exploration = yield* Effect.forEach(plan.exploration, (item) =>
        Effect.gen(function* () {
          if (item.screenshot.length === 0) {
            return item;
          }

          const screenshotUrl = yield* r2
            .signGetObject({
              key: item.screenshot,
              expiresInSeconds: SCREENSHOT_URL_EXPIRES_SECONDS,
            })
            .pipe(Effect.catchTags({ ErrorR2: Effect.die }));
          return { ...item, screenshotUrl };
        }),
      );

      return { ...plan, exploration };
    });

    return {
      PlanCreate: Effect.fn("Rpc.PlanCreate")(function* (input, { headers }) {
        const userId = yield* requireCurrentRpcUserId(headers);
        const plan = yield* service
          .create({ ...input, userId })
          .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
        return yield* withScreenshotUrls(plan);
      }),
      PlanList: Effect.fn("Rpc.PlanList")(function* ({ sessionId }, { headers }) {
        const userId = yield* requireCurrentRpcUserId(headers);
        yield* Effect.annotateCurrentSpan({ "session.id": sessionId });
        const plans = yield* service
          .list({ sessionId, userId })
          .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
        return yield* Effect.forEach(plans, withScreenshotUrls);
      }),
      PlanGet: Effect.fn("Rpc.PlanGet")(function* ({ id }, { headers }) {
        const userId = yield* requireCurrentRpcUserId(headers);
        yield* Effect.annotateCurrentSpan({ "plan.id": id });
        const plan = yield* service
          .get({ id, userId })
          .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
        return yield* withScreenshotUrls(plan);
      }),
      PlanUpdate: Effect.fn("Rpc.PlanUpdate")(function* (input, { headers }) {
        const userId = yield* requireCurrentRpcUserId(headers);
        yield* Effect.annotateCurrentSpan({ "plan.id": input.id });
        const plan = yield* service
          .update({ ...input, userId })
          .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
        return yield* withScreenshotUrls(plan);
      }),
    };
  }),
);
