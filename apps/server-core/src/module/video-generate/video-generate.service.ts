import { Cause, Clock, Context, Effect, Exit, Layer, Option } from "effect";
import { WorkflowEngine } from "effect/unstable/workflow";
import { R2 } from "../../platform/r2.contract";
import { ErrorVideoGenerateInvalidInput } from "./video-generate.error";
import { VideoGenerateRepo } from "./video-generate.repo";
import {
  VideoGenerateStartInput,
  type VideoGenerateExecutionRow,
  type VideoGenerateStatus,
} from "./video-generate.schema";
import { VideoGenerateWorkflow } from "./video-generate.workflow";

const withModuleLogs = Effect.annotateLogs({ module: "video-generate" });
const VIDEO_URL_EXPIRES_IN_SECONDS = 86_400;
const KSUID_EPOCH_SECONDS = 1_400_000_000;
const KSUID_BASE62_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const KSUID_BYTE_LENGTH = 20;
const KSUID_RANDOM_BYTE_LENGTH = 16;

export class VideoGenerateService extends Context.Service<VideoGenerateService>()(
  "module/VideoGenerateService",
  {
    make: Effect.gen(function* () {
      const r2 = yield* R2;
      const repo = yield* VideoGenerateRepo;
      const workflowEngine = yield* WorkflowEngine.WorkflowEngine;

      const start = Effect.fn("VideoGenerateService.start")(function* (
        input: VideoGenerateStartInput,
      ) {
        if (input.prompt.trim().length === 0) {
          return yield* new ErrorVideoGenerateInvalidInput({ message: "Prompt is required" });
        }
        if (input.scenes.length === 0) {
          return yield* new ErrorVideoGenerateInvalidInput({
            message: "At least one video scene is required",
          });
        }
        const now = yield* Clock.currentTimeMillis;
        const id = createId(now);
        yield* repo.insert({
          id,
          executionId: null,
          prompt: input.prompt,
          status: "running",
          phase: "queued",
          message: "Queued for generation",
          progress: 5,
          videoKey: null,
          error: null,
        });
        const executionId = yield* VideoGenerateWorkflow.execute(
          { id, prompt: input.prompt, scenes: input.scenes },
          { discard: true },
        ).pipe(Effect.provideService(WorkflowEngine.WorkflowEngine, workflowEngine));
        yield* repo.updateById(id, { executionId });
        yield* Effect.logInfo("video-generate.started");
        return { executionId };
      }, withModuleLogs);

      const get = Effect.fn("VideoGenerateService.get")(function* (executionId: string) {
        const stored = yield* repo.getByExecutionId(executionId);
        const result = yield* VideoGenerateWorkflow.poll(executionId).pipe(
          Effect.provideService(WorkflowEngine.WorkflowEngine, workflowEngine),
        );
        if (Option.isNone(result)) {
          return toRunningStatus(stored);
        }
        if (result.value._tag === "Suspended") {
          return toRunningStatus(stored);
        }
        if (Exit.isFailure(result.value.exit)) {
          const errors = Cause.prettyErrors(result.value.exit.cause);
          const error = errors[0]?.message ?? Cause.pretty(result.value.exit.cause);
          if (stored) {
            yield* repo.updateById(stored.id, {
              status: "failed",
              phase: "failed",
              message: "Video generation failed",
              error,
            });
          }
          return {
            status: "failed" as const,
            phase: "failed" as const,
            message: "Video generation failed",
            progress: stored?.progress ?? 0,
            error,
          } satisfies VideoGenerateStatus;
        }
        const workflowResult = result.value.exit.value;
        const videoUrl = yield* r2.signGetObject({
          key: workflowResult.videoKey,
          expiresInSeconds: VIDEO_URL_EXPIRES_IN_SECONDS,
        });
        return {
          status: "succeeded" as const,
          phase: "succeeded" as const,
          message: "Video ready",
          progress: 100 as const,
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

function toRunningStatus(row: VideoGenerateExecutionRow | undefined): VideoGenerateStatus {
  return {
    status: "running" as const,
    phase: row?.phase ?? "queued",
    message: row?.message ?? "Queued for generation",
    progress: row?.progress ?? 0,
  };
}

function createId(now: number) {
  return `vge_${createKsuid(now)}`;
}

function createKsuid(now: number) {
  const bytes = new Uint8Array(KSUID_BYTE_LENGTH);
  const timestamp = Math.floor(now / 1000) - KSUID_EPOCH_SECONDS;

  new DataView(bytes.buffer).setUint32(0, timestamp);
  crypto.getRandomValues(bytes.subarray(KSUID_BYTE_LENGTH - KSUID_RANDOM_BYTE_LENGTH));

  return encodeBase62(bytes);
}

function encodeBase62(bytes: Uint8Array) {
  let value = 0n;
  for (const byte of bytes) {
    value = value * 256n + BigInt(byte);
  }

  let output = "";
  while (value > 0n) {
    const remainder = Number(value % 62n);
    output = KSUID_BASE62_ALPHABET[remainder] + output;
    value = value / 62n;
  }

  return output.padStart(27, "0");
}
