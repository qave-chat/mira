import { type MutableRefObject, useRef } from "react";
import { ShieldAlertIcon } from "lucide-react";

import {
  bumpParticleTypingImpulse,
  pulseParticleSubmitImpulse,
} from "@/module/auth/ui/particle-field.ui";
import { Button } from "@/shared/ui/button.ui";
import { Logo } from "@/shared/ui/logo.ui";
import { cn } from "@/shared/util/cn.util";

export type LoginFormProps = {
  onGoogleSignIn: () => void;
  isSubmitting?: boolean;
  error?: string | null;
  errorTitle?: string;
  className?: string;
  particleImpulseRef?: MutableRefObject<number>;
};

export const miraParticleLogoSrc = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="black"/>
  <path d="M52 2H12C6.478 2 2 6.478 2 12v40c0 5.523 4.478 10 10 10h40c5.522 0 10-4.477 10-10V12c0-5.522-4.478-10-10-10zm5 43.667A8.333 8.333 0 0 1 48.667 54H15.333A8.333 8.333 0 0 1 7 45.667V12.334A8.333 8.333 0 0 1 15.333 4h33.334A8.333 8.333 0 0 1 57 12.334v33.333z" fill="white"/>
  <path d="M45.474 33.291c.377.161.55.477.523.943c-.027.469-.35 1.223-.966 2.265c-.618 1.071-1.121 1.725-1.51 1.966c-.389.24-.745.24-1.067 0l-8.573-6.216l1.128 10.508c.079.399-.096.709-.524.921c-.429.215-1.262.322-2.496.322c-1.236 0-2.066-.107-2.496-.322c-.43-.212-.604-.521-.523-.921l1.127-10.508l-8.533 6.216c-.322.24-.685.24-1.087 0c-.402-.241-.913-.895-1.53-1.966c-.617-1.042-.933-1.796-.945-2.265c-.015-.467.168-.782.543-.943l9.701-4.29l-9.701-4.251c-.375-.188-.558-.515-.543-.983c.013-.467.328-1.224.945-2.265c.617-1.044 1.128-1.685 1.53-1.927c.402-.239.765-.239 1.087 0l8.533 6.176l-1.127-10.466c-.08-.428.094-.748.523-.963c.43-.214 1.26-.322 2.496-.322c1.233 0 2.066.108 2.495.322c.429.215.604.535.524.963L33.88 25.751l8.573-6.176c.322-.239.679-.239 1.067 0c.389.242.892.897 1.51 1.967c.616 1.016.938 1.758.966 2.225c.026.469-.146.796-.523.983l-9.701 4.251l9.702 4.29" fill="white"/>
</svg>
`)}`;

export function LoginForm({
  onGoogleSignIn,
  isSubmitting,
  error,
  errorTitle = "Sign in failed",
  className,
  particleImpulseRef: externalParticleImpulseRef,
}: LoginFormProps) {
  const fallbackParticleImpulseRef = useRef(0);
  const particleImpulseRef = externalParticleImpulseRef ?? fallbackParticleImpulseRef;

  return (
    <div
      data-slot="login-form"
      onKeyDown={(e) => bumpParticleTypingImpulse(particleImpulseRef, e)}
      className={cn(
        "relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-card/82 shadow-2xl shadow-black/30 backdrop-blur-xl",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--foreground)/.09),transparent_42%),linear-gradient(180deg,hsl(var(--card)/.94),hsl(var(--card)/.78))]" />
      <div className="relative z-10 flex flex-col gap-6 p-8 md:p-10">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Logo />
          <span className="text-sm font-medium text-muted-foreground">Mira</span>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Login to your account</p>
          </div>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3"
            >
              <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
              <div className="flex flex-col text-sm">
                <span className="font-medium text-foreground">{errorTitle}</span>
                <span className="text-muted-foreground">{error}</span>
              </div>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => {
              pulseParticleSubmitImpulse(particleImpulseRef);
              onGoogleSignIn();
            }}
            className="h-10 w-full"
          >
            <GoogleIcon className="size-4" />
            {isSubmitting ? "Redirecting…" : "Continue with Google"}
          </Button>
          <p className="text-balance text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden className={className}>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.66 4.1-5.5 4.1-3.3 0-6-2.74-6-6.1s2.7-6.1 6-6.1c1.88 0 3.14.8 3.86 1.48l2.64-2.54C16.86 3.36 14.64 2.4 12 2.4 6.92 2.4 2.8 6.52 2.8 11.6s4.12 9.2 9.2 9.2c5.3 0 8.82-3.72 8.82-8.96 0-.6-.06-1.06-.14-1.52H12z"
      />
      <path
        fill="#34A853"
        d="M3.64 7.54l3.14 2.3C7.64 7.76 9.64 6.4 12 6.4c1.88 0 3.14.8 3.86 1.48l2.64-2.54C16.86 3.36 14.64 2.4 12 2.4 8.3 2.4 5.14 4.5 3.64 7.54z"
        opacity="0"
      />
      <path
        fill="#FBBC05"
        d="M12 20.8c2.58 0 4.74-.86 6.32-2.34l-3.02-2.34c-.82.56-1.92.9-3.3.9-2.54 0-4.7-1.72-5.48-4.04l-3.1 2.4C5.06 18.58 8.28 20.8 12 20.8z"
      />
      <path
        fill="#4285F4"
        d="M20.82 12.24c0-.6-.06-1.06-.14-1.52H12v3.9h5.5c-.22 1.16-.94 2.02-2 2.66l3.02 2.34c1.76-1.62 2.3-4.06 2.3-7.38z"
      />
    </svg>
  );
}
