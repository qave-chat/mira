import { Effect } from "effect";
import { Auth } from "./auth.contract";
import { ErrorRpcForbidden, ErrorRpcUnauthorized } from "./rpc-auth.error";

export type RpcAuthError = ErrorRpcUnauthorized | ErrorRpcForbidden;

type RpcHeaders = Headers | Record<string, string | ReadonlyArray<string> | undefined>;

const toHeaders = (headers: RpcHeaders): Headers => {
  if (headers instanceof Headers) return headers;
  const out = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    if (typeof value === "string") {
      out.set(key, value);
    } else {
      for (const item of value) out.append(key, item);
    }
  }
  return out;
};

export const requireCurrentRpcUserId = Effect.fn("RpcAuth.requireCurrentUserId")(function* (
  headers: RpcHeaders,
) {
  const auth = yield* Auth;
  const session = yield* auth.resolveSession(toHeaders(headers)).pipe(
    Effect.catchTags({
      ErrorAuth: Effect.die,
    }),
  );
  if (!session.user || !session.session) {
    return yield* new ErrorRpcUnauthorized({ message: "Authentication required" });
  }
  return session.user.id;
});

export const requireOwnedByCurrentUser = Effect.fn("RpcAuth.requireOwnedByCurrentUser")(function* <
  A extends { readonly userId: string } | null,
>(headers: RpcHeaders, resource: A, message = "Forbidden") {
  const userId = yield* requireCurrentRpcUserId(headers);
  if (resource === null) return resource;
  if (resource.userId !== userId) {
    return yield* new ErrorRpcForbidden({ message });
  }
  return resource;
});

export const forbidRpcAction = Effect.fn("RpcAuth.forbidAction")(function* (
  headers: RpcHeaders,
  message = "Forbidden",
) {
  yield* requireCurrentRpcUserId(headers);
  return yield* new ErrorRpcForbidden({ message });
});
