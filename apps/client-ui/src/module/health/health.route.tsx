import { createFileRoute } from "@tanstack/react-router";
import { HealthDot } from "./health.ui";
import { useHealthStatus } from "./use-health-status.hook";

export const Route = createFileRoute("/")({
  component: HealthRoute,
});

function HealthRoute() {
  const status = useHealthStatus();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <section className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <HealthDot status={status} className="size-4" />
          <div>
            <h1 className="text-xl font-semibold">Mira</h1>
            <p className="text-sm text-muted-foreground">Health endpoint is {status}.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
