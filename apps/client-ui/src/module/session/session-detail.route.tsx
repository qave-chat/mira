import { useAtomValue } from "@effect/atom-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AsyncResult } from "effect/unstable/reactivity";
import { HttpClient } from "@mira/client-api/http-atom";
import { SessionDetail } from "@/module/session/ui/session-detail.ui";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb.ui";
import { ModuleLayout, ModuleLayoutHeader } from "@/shared/ui/module-layout.ui";

export const Route = createFileRoute("/sessions/$sessionId")({
  validateSearch: (search): { name?: string } => ({
    name: typeof search.name === "string" && search.name.length > 0 ? search.name : undefined,
  }),
  component: SessionDetailRoute,
});

function SessionDetailRoute() {
  const { sessionId } = Route.useParams();
  const { name } = Route.useSearch();
  const sessionResult = useAtomValue(
    HttpClient.query("sessions", "get", {
      params: { id: sessionId },
      reactivityKeys: ["sessions", sessionId],
    }),
  );
  const sessionName = AsyncResult.match(sessionResult, {
    onInitial: () => name,
    onSuccess: (result) => result.value.name,
    onFailure: () => name,
  });

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
              <BreadcrumbPage>{sessionName ?? sessionId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </ModuleLayoutHeader>
      <div className="min-h-0 w-full flex-1">
        <SessionDetail />
      </div>
    </ModuleLayout>
  );
}
