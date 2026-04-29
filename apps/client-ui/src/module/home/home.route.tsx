import { createFileRoute } from "@tanstack/react-router";
import {
  ModuleLayout,
  ModuleLayoutBody,
  ModuleLayoutHeader,
  ModuleLayoutTitle,
} from "@/shared/ui/module-layout.ui";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  return (
    <ModuleLayout>
      <ModuleLayoutHeader>
        <ModuleLayoutTitle>Home</ModuleLayoutTitle>
      </ModuleLayoutHeader>
      <ModuleLayoutBody>
        <section className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-semibold">Welcome to Mira</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Select a module from the sidebar to get started.
          </p>
        </section>
      </ModuleLayoutBody>
    </ModuleLayout>
  );
}
