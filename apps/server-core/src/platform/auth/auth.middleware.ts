import { Context, Effect } from "effect";
import { HttpRouter, HttpServerRequest } from "effect/unstable/http";
import { Auth, type AuthSessionRecord } from "./auth.contract";

// Request-scoped current session/user. Both fields are null for anonymous
// requests; middleware always provides the service so handlers can depend on
// it unconditionally and branch on nullability.
export class CurrentUser extends Context.Service<CurrentUser, AuthSessionRecord>()(
  "platform/CurrentUser",
) {}

export const AuthMiddleware = HttpRouter.middleware<{ provides: CurrentUser }>()(
  Effect.gen(function* () {
    const auth = yield* Auth;
    return (next) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const headers = new Headers(request.headers as Record<string, string>);
        const record = yield* auth
          .resolveSession(headers)
          .pipe(
            Effect.catch((err) =>
              Effect.logWarning(`Auth middleware failed to resolve session: ${err.message}`).pipe(
                Effect.as({ user: null, session: null } satisfies AuthSessionRecord),
              ),
            ),
          );
        return yield* Effect.provideService(next, CurrentUser, record);
      });
  }),
  { global: true },
);
