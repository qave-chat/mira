import { Config, Effect, Layer, Option, Redacted } from "effect";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { genericOAuth } from "better-auth/plugins";
import { Db } from "../db.contract";
import { Auth, ErrorAuth } from "./auth.contract";

const BASE_PATH = "/api/auth";
const DEFAULT_BASE_URL = "http://localhost:38412";
const DEFAULT_TRUSTED_ORIGIN = "http://localhost:47823";
const DEFAULT_GOOGLE_DISCOVERY = "https://accounts.google.com/.well-known/openid-configuration";

const AuthConfig = Config.all({
  secret: Config.redacted("BETTER_AUTH_SECRET").pipe(Config.option),
  baseUrl: Config.string("BETTER_AUTH_URL").pipe(Config.withDefault(DEFAULT_BASE_URL)),
  trustedOrigins: Config.string("BETTER_AUTH_TRUSTED_ORIGINS").pipe(
    Config.map((raw) =>
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
    Config.withDefault<ReadonlyArray<string>>([]),
  ),
  googleClientId: Config.string("GOOGLE_CLIENT_ID").pipe(Config.option),
  googleClientSecret: Config.redacted("GOOGLE_CLIENT_SECRET").pipe(Config.option),
  googleDiscoveryUrl: Config.string("AUTH_GOOGLE_DISCOVERY_URL").pipe(
    Config.withDefault(DEFAULT_GOOGLE_DISCOVERY),
  ),
});

export const AuthLive = Layer.effect(
  Auth,
  Effect.gen(function* () {
    const db = yield* Db;
    const {
      secret,
      baseUrl,
      trustedOrigins,
      googleClientId,
      googleClientSecret,
      googleDiscoveryUrl,
    } = yield* AuthConfig;
    if (Option.isNone(secret)) {
      yield* Effect.logWarning(
        "BETTER_AUTH_SECRET not set — using dev fallback (do NOT ship this to prod)",
      );
    }
    const google =
      Option.isSome(googleClientId) && Option.isSome(googleClientSecret)
        ? {
            providerId: "google" as const,
            clientId: googleClientId.value,
            clientSecret: Redacted.value(googleClientSecret.value),
            discoveryUrl: googleDiscoveryUrl,
            scopes: ["openid", "email", "profile"],
          }
        : undefined;
    if (!google) {
      yield* Effect.logWarning(
        "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — Google sign-in disabled",
      );
    } else if (googleDiscoveryUrl !== DEFAULT_GOOGLE_DISCOVERY) {
      yield* Effect.logInfo(`Google OAuth pointed at emulator: ${googleDiscoveryUrl}`);
    }

    const auth = betterAuth({
      basePath: BASE_PATH,
      baseURL: baseUrl,
      secret: Option.match(secret, {
        onNone: () => "dev-only-insecure-secret",
        onSome: (r) => Redacted.value(r),
      }),
      trustedOrigins: Array.from(new Set([DEFAULT_TRUSTED_ORIGIN, ...trustedOrigins])),
      database: drizzleAdapter(db.client, { provider: "pg" }),
      onAPIError: {
        errorURL: "/login",
      },
      plugins: google ? [genericOAuth({ config: [google] })] : [],
    });

    const wrap = (cause: unknown) =>
      new ErrorAuth({
        message: cause instanceof Error ? cause.message : String(cause),
        cause,
      });

    return Auth.of({
      basePath: BASE_PATH,
      handler: (request) =>
        Effect.tryPromise({
          try: () => auth.handler(request),
          catch: wrap,
        }),
      resolveSession: (headers) =>
        Effect.tryPromise({
          try: () => auth.api.getSession({ headers }),
          catch: wrap,
        }).pipe(
          Effect.map((res) => ({
            user: res?.user
              ? { id: res.user.id, email: res.user.email, name: res.user.name }
              : null,
            session: res?.session ? { id: res.session.id, userId: res.session.userId } : null,
          })),
        ),
      signOut: (headers) =>
        Effect.tryPromise({
          try: () => auth.api.signOut({ headers, asResponse: true }),
          catch: wrap,
        }),
      signInOAuth2: (body, headers) =>
        Effect.tryPromise({
          try: () =>
            (
              auth.api as { signInWithOAuth2: (args: unknown) => Promise<Response> }
            ).signInWithOAuth2({ body, headers, asResponse: true }),
          catch: wrap,
        }),
    });
  }),
);
