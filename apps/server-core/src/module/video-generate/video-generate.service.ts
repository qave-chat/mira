import { Cause, Context, Effect, Exit, Layer, Option } from "effect";
import { randomUUID } from "node:crypto";
import { WorkflowEngine } from "effect/unstable/workflow";
import { R2 } from "../../platform/r2.contract";
import { ErrorVideoGenerateInvalidInput } from "./video-generate.error";
import { VideoGenerateStartInput, type VideoGenerateStatus } from "./video-generate.schema";
import { VideoGenerateWorkflow } from "./video-generate.workflow";

const withModuleLogs = Effect.annotateLogs({ module: "video-generate" });
const VIDEO_URL_EXPIRES_IN_SECONDS = 86_400;

export class VideoGenerateService extends Context.Service<VideoGenerateService>()(
  "module/VideoGenerateService",
  {
    make: Effect.gen(function* () {
      const r2 = yield* R2;
      const workflowEngine = yield* WorkflowEngine.WorkflowEngine;

      const start = Effect.fn("VideoGenerateService.start")(function* (
        input: VideoGenerateStartInput,
      ) {
        if (input.prompt.trim().length === 0) {
          return yield* new ErrorVideoGenerateInvalidInput({ message: "Prompt is required" });
        }
        if (input.photoKeys.length === 0) {
          return yield* new ErrorVideoGenerateInvalidInput({
            message: "At least one photo key is required",
          });
        }
        const id = yield* Effect.sync(() => randomUUID());
        const executionId = yield* VideoGenerateWorkflow.execute(
          { id, prompt: input.prompt, photoKeys: input.photoKeys },
          { discard: true },
        ).pipe(Effect.provideService(WorkflowEngine.WorkflowEngine, workflowEngine));
        yield* Effect.logInfo("video-generate.started");
        return { executionId };
      }, withModuleLogs);

      const get = Effect.fn("VideoGenerateService.get")(function* (executionId: string) {
        const result = yield* VideoGenerateWorkflow.poll(executionId).pipe(
          Effect.provideService(WorkflowEngine.WorkflowEngine, workflowEngine),
        );
        if (Option.isNone(result)) {
          return { status: "running" as const } satisfies VideoGenerateStatus;
        }
        if (result.value._tag === "Suspended") {
          return { status: "running" as const } satisfies VideoGenerateStatus;
        }
        if (Exit.isFailure(result.value.exit)) {
          const errors = Cause.prettyErrors(result.value.exit.cause);
          return {
            status: "failed" as const,
            error: errors[0]?.message ?? Cause.pretty(result.value.exit.cause),
          } satisfies VideoGenerateStatus;
        }
        const workflowResult = result.value.exit.value;
        const videoUrl = yield* r2.signGetObject({
          key: workflowResult.videoKey,
          expiresInSeconds: VIDEO_URL_EXPIRES_IN_SECONDS,
        });
        return {
          status: "succeeded" as const,
          result: {
            videoKey: workflowResult.videoKey,
            videoUrl,
            videoUrlExpiresInSeconds: VIDEO_URL_EXPIRES_IN_SECONDS,
            contentType: workflowResult.contentType,
          },
        } satisfies VideoGenerateStatus;
      }, withModuleLogs);

      return { start, get } as const;
    }),
  },
) {}

export const VideoGenerateServiceLive = Layer.effect(
  VideoGenerateService,
  VideoGenerateService.make,
);
