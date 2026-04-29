import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/unstable/rpc";
import {
  VideoGenerateStartInput,
  VideoGenerateStartResult,
  VideoGenerateStatus,
} from "./video-generate.schema";
import { ErrorVideoGenerateInvalidInput } from "./video-generate.error";

export class VideoGenerateStart extends Rpc.make("VideoGenerateStart", {
  payload: VideoGenerateStartInput,
  success: VideoGenerateStartResult,
  error: ErrorVideoGenerateInvalidInput,
}) {}

export class VideoGenerateGet extends Rpc.make("VideoGenerateGet", {
  payload: Schema.Struct({ executionId: Schema.String }),
  success: VideoGenerateStatus,
}) {}

export const VideoGenerateRpcs = RpcGroup.make(VideoGenerateStart, VideoGenerateGet);
