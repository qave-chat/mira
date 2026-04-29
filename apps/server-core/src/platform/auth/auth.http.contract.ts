import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";

const SignInOAuth2Payload = Schema.Struct({
  providerId: Schema.String,
  callbackURL: Schema.String,
  errorCallbackURL: Schema.optional(Schema.String),
});

const SignInOAuth2Response = Schema.Struct({
  url: Schema.optional(Schema.String),
  redirect: Schema.optional(Schema.Boolean),
});

export class AuthHttpGroup extends HttpApiGroup.make("auth")
  .add(HttpApiEndpoint.post("signOut", "/auth/sign-out"))
  .add(
    HttpApiEndpoint.post("signInOAuth2", "/auth/sign-in/oauth2", {
      payload: SignInOAuth2Payload,
      success: SignInOAuth2Response,
    }),
  ) {}
