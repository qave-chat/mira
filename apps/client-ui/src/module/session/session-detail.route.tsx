import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb.ui";
import { SessionDetail } from "@/module/session/ui/session-detail.ui";
import { ModuleLayout, ModuleLayoutBody, ModuleLayoutHeader } from "@/shared/ui/module-layout.ui";

export const Route = createFileRoute("/sessions/$sessionId")({
  component: SessionDetailRoute,
});

function SessionDetailRoute() {
  const { sessionId } = Route.useParams();

  return (
    <ModuleLayout>
      <ModuleLayoutHeader>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/sessions" />}>Sessions</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{sessionId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </ModuleLayoutHeader>
      <ModuleLayoutBody>
        <SessionDetail sessionId={sessionId} onGenerateVideo={() => {}} />
      </ModuleLayoutBody>
    </ModuleLayout>
  );
}
