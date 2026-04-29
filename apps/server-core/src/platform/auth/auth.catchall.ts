import { Effect } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/unstable/http";
import { Auth } from "./auth.contract";

export const AuthCatchallLive = HttpRouter.use((router) =>
  Effect.gen(function* () {
    const auth = yield* Auth;
    const handleAuth = Effect.fn("AuthCatchall")(function* (
      request: HttpServerRequest.HttpServerRequest,
    ) {
      const webRequest = yield* HttpServerRequest.toWeb(request);
      const webResponse = yield* auth.handler(webRequest);
      return HttpServerResponse.fromWeb(webResponse);
    });
    yield* router.add("*", "/api/auth/*", handleAuth);
  }),
);
