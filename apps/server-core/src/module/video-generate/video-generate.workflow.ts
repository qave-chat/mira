import { Effect, Schema } from "effect";
import { Workflow } from "effect/unstable/workflow";
import { R2 } from "../../platform/r2.contract";
import { VideoGenerateRenderer } from "./video-generate.renderer";
import { VideoGenerateRepo } from "./video-generate.repo";
import { VideoGenerateWorkflowInput, VideoGenerateWorkflowResult } from "./video-generate.schema";

const PHOTO_URL_EXPIRES_IN_SECONDS = 60 * 60;

export class ErrorVideoGenerateFailed extends Schema.TaggedErrorClass<ErrorVideoGenerateFailed>()(
  "ErrorVideoGenerateFailed",
  { message: Schema.String },
) {}

export const VideoGenerateWorkflow = Workflow.make({
  name: "VideoGenerateWorkflow",
  payload: VideoGenerateWorkflowInput,
  success: VideoGenerateWorkflowResult,
  error: ErrorVideoGenerateFailed,
  idempotencyKey: ({ id }) => id,
});

export const VideoGenerateWorkflowLive = VideoGenerateWorkflow.toLayer((input) =>
  Effect.gen(function* () {
    const r2 = yield* R2;
    const renderer = yield* VideoGenerateRenderer;
    const repo = yield* VideoGenerateRepo;
    yield* Effect.logInfo("video-generate.workflow.started", {
      id: input.id,
      photoCount: input.photoKeys.length,
    });
    yield* repo
      .updateById(input.id, {
        phase: "signing-photos",
        message: "Preparing source images",
        progress: 15,
      })
      .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
    const photoUrls = yield* Effect.forEach(input.photoKeys, (key) =>
      r2.signGetObject({ key, expiresInSeconds: PHOTO_URL_EXPIRES_IN_SECONDS }),
    ).pipe(Effect.mapError((error) => new ErrorVideoGenerateFailed({ message: error.message })));
    yield* Effect.logInfo("video-generate.photos.signed", { id: input.id });
    yield* repo
      .updateById(input.id, {
        phase: "rendering",
        message: "Rendering video",
        progress: 35,
      })
      .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
    const rendered = yield* renderer
      .render({ id: input.id, prompt: input.prompt, photoUrls })
      .pipe(Effect.mapError((error) => new ErrorVideoGenerateFailed({ message: error.message })));
    yield* Effect.logInfo("video-generate.render.completed", {
      id: input.id,
      bytes: rendered.byteLength,
    });
    const videoKey = `video-generate/renders/${input.id}.mp4`;
    yield* repo
      .updateById(input.id, {
        phase: "uploading",
        message: "Saving rendered video",
        progress: 85,
      })
      .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
    yield* r2
      .putObject({ key: videoKey, body: rendered, contentType: "video/mp4" })
      .pipe(Effect.mapError((error) => new ErrorVideoGenerateFailed({ message: error.message })));
    yield* repo
      .updateById(input.id, {
        status: "succeeded",
        phase: "succeeded",
        message: "Video ready",
        progress: 100,
        videoKey,
      })
      .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
    yield* Effect.logInfo("video-generate.r2.uploaded", { id: input.id, videoKey });
    return { videoKey, contentType: "video/mp4" as const };
  }),
);
