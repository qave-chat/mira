import { Context, Effect, Schema } from "effect";

export class ErrorAuth extends Schema.TaggedErrorClass<ErrorAuth>()("ErrorAuth", {
  message: Schema.String,
  cause: Schema.Defect,
}) {}

export interface AuthSessionRecord {
  readonly user: { readonly id: string; readonly email: string; readonly name: string } | null;
  readonly session: { readonly id: string; readonly userId: string } | null;
}

export interface SignInOAuth2Body {
  readonly providerId: string;
  readonly callbackURL: string;
  readonly errorCallbackURL?: string | undefined;
}

export interface AuthService {
  readonly handler: (request: Request) => Effect.Effect<Response, ErrorAuth>;
  readonly resolveSession: (headers: Headers) => Effect.Effect<AuthSessionRecord, ErrorAuth>;
  readonly signOut: (headers: Headers) => Effect.Effect<Response, ErrorAuth>;
  readonly signInOAuth2: (
    body: SignInOAuth2Body,
    headers: Headers,
  ) => Effect.Effect<Response, ErrorAuth>;
  readonly basePath: string;
}

export class Auth extends Context.Service<Auth, AuthService>()("platform/Auth") {}
