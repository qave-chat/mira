import { Effect } from "effect";
import { HttpServerRequest } from "effect/unstable/http";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { HttpApiDef } from "../../platform/http.contract";
import { Auth } from "../../platform/auth/auth.contract";
import { SessionsService } from "./sessions.service";

export const SessionsHttpHandlers = HttpApiBuilder.group(
  HttpApiDef,
  "sessions",
  Effect.fn("SessionsHttpHandlers")(function* (handlers) {
    const auth = yield* Auth;
    const service = yield* SessionsService;

    const currentUserId = Effect.fn("SessionsHttpHandlers.currentUserId")(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const headers = new Headers(request.headers as Record<string, string>);
      const session = yield* auth
        .resolveSession(headers)
        .pipe(Effect.catchTags({ ErrorAuth: Effect.die }));
      if (!session.user || !session.session) {
        return yield* Effect.die("Authentication required");
      }
      return session.user.id;
    });

    return handlers
      .handle(
        "list",
        Effect.fn("HttpApi.sessions.list")(function* () {
          const userId = yield* currentUserId();
          return yield* service.list(userId).pipe(Effect.catchTags({ ErrorDb: Effect.die }));
        }),
      )
      .handle(
        "get",
        Effect.fn("HttpApi.sessions.get")(function* ({ params }) {
          const userId = yield* currentUserId();
          return yield* service
            .get({ id: params.id, userId })
            .pipe(Effect.catchTags({ ErrorDb: Effect.die, ErrorSessionNotFound: Effect.die }));
        }),
      )
      .handle(
        "create",
        Effect.fn("HttpApi.sessions.create")(function* ({ payload }) {
          const userId = yield* currentUserId();
          return yield* service
            .create({ ...payload, userId })
            .pipe(Effect.catchTags({ ErrorDb: Effect.die }));
        }),
      )
      .handle(
        "delete",
        Effect.fn("HttpApi.sessions.delete")(function* ({ params }) {
          const userId = yield* currentUserId();
          return yield* service
            .delete({ id: params.id, userId })
            .pipe(Effect.catchTags({ ErrorDb: Effect.die, ErrorSessionNotFound: Effect.die }));
        }),
      );
  }),
);
