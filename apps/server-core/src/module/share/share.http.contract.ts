import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import {
  GeneratedVideo,
  GeneratedVideoCreateInput,
  Share,
  ShareComment,
  ShareCommentCreateInput,
  ShareCreateInput,
  ShareWithComments,
} from "./share.schema";
import {
  ErrorGeneratedVideoNotFound,
  ErrorShareInvalidInput,
  ErrorShareNotFound,
} from "./share.error";

export class ShareHttpGroup extends HttpApiGroup.make("share")
  .add(
    HttpApiEndpoint.post("createGeneratedVideo", "/generated-videos", {
      payload: GeneratedVideoCreateInput,
      success: GeneratedVideo,
      error: ErrorShareInvalidInput,
    }),
  )
  .add(
    HttpApiEndpoint.post("create", "/shares", {
      payload: ShareCreateInput,
      success: Share,
      error: ErrorGeneratedVideoNotFound,
    }),
  )
  .add(
    HttpApiEndpoint.get("get", "/shares/:shareId", {
      params: { shareId: Schema.String },
      success: ShareWithComments,
      error: ErrorShareNotFound,
    }),
  )
  .add(
    HttpApiEndpoint.post("createComment", "/shares/:shareId/comments", {
      params: { shareId: Schema.String },
      payload: ShareCommentCreateInput,
      success: ShareComment,
      error: [ErrorShareNotFound, ErrorShareInvalidInput],
    }),
  ) {}
