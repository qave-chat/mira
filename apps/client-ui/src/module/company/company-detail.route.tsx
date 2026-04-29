import { createFileRoute } from "@tanstack/react-router";
import {
  ModuleLayout,
  ModuleLayoutBody,
  ModuleLayoutHeader,
  ModuleLayoutTitle,
} from "@/shared/ui/module-layout.ui";

export const Route = createFileRoute("/company/$companyId")({
  component: CompanyDetailRoute,
});

function CompanyDetailRoute() {
  const { companyId } = Route.useParams();

  return (
    <ModuleLayout>
      <ModuleLayoutHeader>
        <ModuleLayoutTitle>Company</ModuleLayoutTitle>
      </ModuleLayoutHeader>
      <ModuleLayoutBody>
        <section className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-semibold">Company {companyId}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Details for this company will appear here once the module is wired to data.
          </p>
        </section>
      </ModuleLayoutBody>
    </ModuleLayout>
  );
}
