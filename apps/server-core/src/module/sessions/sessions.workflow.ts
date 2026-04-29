import { Effect, Schema } from "effect";
import { Workflow } from "effect/unstable/workflow";
import { R2 } from "../../platform/r2.contract";
import { SessionDeleteR2WorkflowInput, SessionDeleteR2WorkflowResult } from "./sessions.schema";

export class ErrorSessionDeleteR2Failed extends Schema.TaggedErrorClass<ErrorSessionDeleteR2Failed>()(
  "ErrorSessionDeleteR2Failed",
  { message: Schema.String },
) {}

export const SessionDeleteR2Workflow = Workflow.make({
  name: "SessionDeleteR2Workflow",
  payload: SessionDeleteR2WorkflowInput,
  success: SessionDeleteR2WorkflowResult,
  error: ErrorSessionDeleteR2Failed,
  idempotencyKey: ({ sessionId }) => sessionId,
});

export const SessionDeleteR2WorkflowLive = SessionDeleteR2Workflow.toLayer((input) =>
  Effect.gen(function* () {
    const r2 = yield* R2;
    const keys = Array.from(new Set(input.keys.filter((key) => key.length > 0)));

    yield* Effect.logInfo("session.r2-delete.workflow.started", {
      sessionId: input.sessionId,
      keyCount: keys.length,
    });

    yield* Effect.forEach(keys, (key) =>
      r2
        .deleteObject({ key })
        .pipe(
          Effect.mapError((error) => new ErrorSessionDeleteR2Failed({ message: error.message })),
        ),
    );

    yield* Effect.logInfo("session.r2-delete.workflow.completed", {
      sessionId: input.sessionId,
      deleted: keys.length,
    });

    return { deleted: keys.length };
  }),
);
