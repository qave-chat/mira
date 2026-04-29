import { Schema } from "effect";

export const VideoGenerateStartInput = Schema.Struct({
  prompt: Schema.String,
  photoKeys: Schema.Array(Schema.String),
});
export type VideoGenerateStartInput = typeof VideoGenerateStartInput.Type;

export const VideoGenerateWorkflowInput = Schema.Struct({
  id: Schema.String,
  prompt: Schema.String,
  photoKeys: Schema.Array(Schema.String),
});
export type VideoGenerateWorkflowInput = typeof VideoGenerateWorkflowInput.Type;

export const VideoGenerateWorkflowResult = Schema.Struct({
  videoKey: Schema.String,
  contentType: Schema.Literal("video/mp4"),
});
export type VideoGenerateWorkflowResult = typeof VideoGenerateWorkflowResult.Type;

export const VideoGenerateStartResult = Schema.Struct({
  executionId: Schema.String,
});
export type VideoGenerateStartResult = typeof VideoGenerateStartResult.Type;

export const VideoGenerateResult = Schema.Struct({
  videoKey: Schema.String,
  videoUrl: Schema.String,
  videoUrlExpiresInSeconds: Schema.Literal(86_400),
  contentType: Schema.Literal("video/mp4"),
});
export type VideoGenerateResult = typeof VideoGenerateResult.Type;

export const VideoGenerateStatus = Schema.Union([
  Schema.Struct({ status: Schema.Literal("running") }),
  Schema.Struct({ status: Schema.Literal("succeeded"), result: VideoGenerateResult }),
  Schema.Struct({ status: Schema.Literal("failed"), error: Schema.String }),
]);
export type VideoGenerateStatus = typeof VideoGenerateStatus.Type;
