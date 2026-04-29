import { Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { HttpApiDef } from "../../platform/http.contract";
import { ShareService } from "./share.service";

export const ShareHttpHandlers = HttpApiBuilder.group(
  HttpApiDef,
  "share",
  Effect.fn("ShareHttpHandlers")(function* (handlers) {
    const service = yield* ShareService;
    return handlers
      .handle(
        "createGeneratedVideo",
        Effect.fn("HttpApi.share.createGeneratedVideo")(function* ({ payload }) {
          return yield* service.createGeneratedVideo(payload);
        }),
      )
      .handle(
        "create",
        Effect.fn("HttpApi.share.create")(function* ({ payload }) {
          return yield* service.create(payload);
        }),
      )
      .handle(
        "get",
        Effect.fn("HttpApi.share.get")(function* ({ params }) {
          return yield* service.get(params.shareId);
        }),
      )
      .handle(
        "createComment",
        Effect.fn("HttpApi.share.createComment")(function* ({ params, payload }) {
          return yield* service.createComment(params.shareId, payload);
        }),
      );
  }),
);
