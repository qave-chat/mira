import { createFileRoute } from "@tanstack/react-router";
import {
  ModuleLayout,
  ModuleLayoutBody,
  ModuleLayoutHeader,
  ModuleLayoutTitle,
} from "@/shared/ui/module-layout.ui";

export const Route = createFileRoute("/sessions/$sessionId")({
  component: SessionDetailRoute,
});

function SessionDetailRoute() {
  const { sessionId } = Route.useParams();

  return (
    <ModuleLayout>
      <ModuleLayoutHeader>
        <ModuleLayoutTitle>Session</ModuleLayoutTitle>
      </ModuleLayoutHeader>
      <ModuleLayoutBody>
        <section className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-semibold">Session {sessionId}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Details for this session will appear here once the module is wired to data.
          </p>
        </section>
      </ModuleLayoutBody>
    </ModuleLayout>
  );
}
