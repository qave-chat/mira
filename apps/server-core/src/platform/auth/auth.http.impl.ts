import { Effect } from "effect";
import { HttpServerRequest, HttpServerResponse } from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { HttpApiDef } from "../http.contract";
import { Auth } from "./auth.contract";

export const AuthHttpHandlers = HttpApiBuilder.group(
  HttpApiDef,
  "auth",
  Effect.fn("AuthHttpHandlers")(function* (handlers) {
    const auth = yield* Auth;
    return handlers
      .handle(
        "signOut",
        Effect.fn("HttpApi.auth.signOut")(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest;
          const headers = new Headers(request.headers as Record<string, string>);
          const webResponse = yield* auth
            .signOut(headers)
            .pipe(Effect.catchTags({ ErrorAuth: Effect.die }));
          return HttpServerResponse.fromWeb(webResponse);
        }),
      )
      .handle(
        "signInOAuth2",
        Effect.fn("HttpApi.auth.signInOAuth2")(function* ({ payload }) {
          const request = yield* HttpServerRequest.HttpServerRequest;
          const headers = new Headers(request.headers as Record<string, string>);
          const webResponse = yield* auth
            .signInOAuth2(payload, headers)
            .pipe(Effect.catchTags({ ErrorAuth: Effect.die }));
          return HttpServerResponse.fromWeb(webResponse);
        }),
      );
  }),
);
