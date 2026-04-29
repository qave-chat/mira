import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ModuleLayout,
  ModuleLayoutBody,
  ModuleLayoutHeader,
  ModuleLayoutTitle,
} from "@/shared/ui/module-layout.ui";

export const Route = createFileRoute("/company")({
  component: CompanyRoute,
});

function CompanyRoute() {
  return (
    <ModuleLayout>
      <ModuleLayoutHeader>
        <ModuleLayoutTitle>Companies</ModuleLayoutTitle>
      </ModuleLayoutHeader>
      <ModuleLayoutBody>
        <section className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-semibold">Companies</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Company records will appear here once the module is wired to data.
          </p>
          <Link
            to="/company/$companyId"
            params={{ companyId: "sample" }}
            className="mt-4 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            View sample company
          </Link>
        </section>
      </ModuleLayoutBody>
    </ModuleLayout>
  );
}
