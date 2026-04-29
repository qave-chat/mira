import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Option, Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { HttpClient } from "@mira/client-api/http-atom";
import { miraParticleLogoSrc, LoginForm } from "@/module/auth/ui/login-form.ui";
import { ParticleField } from "@/module/auth/ui/particle-field.ui";
import { useAtomSet, useAtomValue } from "@effect/atom-react";

export const Route = createFileRoute("/login")({
  validateSearch: (search): { error?: string; reason?: string } => ({
    error: typeof search.error === "string" ? search.error : undefined,
    reason: typeof search.reason === "string" ? search.reason : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const signInAtom = HttpClient.mutation("auth", "signInOAuth2");
  const signIn = useAtomSet(signInAtom, { mode: "promiseExit" });
  const result = useAtomValue(signInAtom);
  const authError = getAuthErrorMessage(search.error, search.reason);
  const particleImpulseRef = useRef(0);

  return (
    <div className="relative grid min-h-svh w-full overflow-hidden bg-background md:grid-cols-2">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-45 md:pointer-events-auto md:relative md:inset-auto md:opacity-100">
        <ParticleField
          src={miraParticleLogoSrc}
          className="h-full min-h-svh w-full"
          threshold={54}
          sampleStep={2.15}
          dotSize={0.62}
          renderScale={0.86}
          fit="contain"
          mouseForce={54}
          mouseRadius={150}
          denseParticles
          adaptToTheme={false}
          color="rgba(255, 255, 255, 0.42)"
          typingImpulseRef={particleImpulseRef}
        />
      </div>
      <div className="relative z-10 flex min-h-svh w-full items-center justify-center px-4 py-8 sm:px-6 md:px-8">
        <LoginForm
          className="shrink-0"
          particleImpulseRef={particleImpulseRef}
          isSubmitting={AsyncResult.isWaiting(result) || AsyncResult.isSuccess(result)}
          error={
            AsyncResult.isFailure(result)
              ? Option.match(AsyncResult.error(result), {
                  onNone: () => "Sign in failed",
                  onSome: (e) => (e instanceof Error ? e.message : String(e)),
                })
              : authError
          }
          errorTitle={authError ? "Sign in failed" : undefined}
          onGoogleSignIn={async () => {
            const exit = await signIn({
              payload: {
                providerId: "google",
                callbackURL: window.location.origin,
                errorCallbackURL: `${window.location.origin}/login`,
              },
            });
            if (Exit.isSuccess(exit) && exit.value.url) {
              window.open(exit.value.url, "_blank");
            }
          }}
        />
      </div>
    </div>
  );
}

function getAuthErrorMessage(error?: string, reason?: string) {
  if (
    reason === "domain" ||
    error === "unable_to_create_user" ||
    error === "unable_to_create_session"
  ) {
    return "Google sign-in could not be completed. Please try again.";
  }
  return error ? "Google sign-in could not be completed. Please try again." : null;
}
