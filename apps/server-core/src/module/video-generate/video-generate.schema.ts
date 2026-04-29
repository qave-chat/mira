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

export const VideoGeneratePhase = Schema.Union([
  Schema.Literal("queued"),
  Schema.Literal("signing-photos"),
  Schema.Literal("rendering"),
  Schema.Literal("uploading"),
  Schema.Literal("succeeded"),
  Schema.Literal("failed"),
]);
export type VideoGeneratePhase = typeof VideoGeneratePhase.Type;

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
  Schema.Struct({
    status: Schema.Literal("running"),
    phase: VideoGeneratePhase,
    message: Schema.String,
    progress: Schema.Number,
  }),
  Schema.Struct({
    status: Schema.Literal("succeeded"),
    phase: Schema.Literal("succeeded"),
    message: Schema.String,
    progress: Schema.Literal(100),
    result: VideoGenerateResult,
  }),
  Schema.Struct({
    status: Schema.Literal("failed"),
    phase: Schema.Literal("failed"),
    message: Schema.String,
    progress: Schema.Number,
    error: Schema.String,
  }),
]);
export type VideoGenerateStatus = typeof VideoGenerateStatus.Type;

export type VideoGenerateExecutionRow = {
  readonly id: string;
  readonly executionId: string | null;
  readonly prompt: string;
  readonly status: "running" | "succeeded" | "failed";
  readonly phase: VideoGeneratePhase;
  readonly message: string;
  readonly progress: number;
  readonly videoKey: string | null;
  readonly error: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type VideoGenerateExecutionPatch = Partial<
  Omit<VideoGenerateExecutionRow, "id" | "prompt" | "createdAt" | "updatedAt">
>;
