import type { FormEvent } from "react";
import { useState } from "react";
import { useAtomRefresh, useAtomSet, useAtomValue } from "@effect/atom-react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Cause, Exit } from "effect";
import { AsyncResult } from "effect/unstable/reactivity";
import { HttpClient } from "@mira/client-api/http-atom";
import { SessionCreateDialog } from "@/module/session/ui/session-create-dialog.ui";
import { SessionList } from "@/module/session/ui/session-list.ui";
import {
  ModuleLayoutActions,
  ModuleLayout,
  ModuleLayoutBody,
  ModuleLayoutHeader,
  ModuleLayoutTitle,
} from "@/shared/ui/module-layout.ui";

export const Route = createFileRoute("/sessions")({
  component: SessionRoute,
});

function SessionRoute() {
  const router = useRouter();
  const sessionsAtom = HttpClient.query("sessions", "list", { reactivityKeys: ["sessions"] });
  const sessionsResult = useAtomValue(sessionsAtom);
  const refreshSessions = useAtomRefresh(sessionsAtom);
  const createSessionMutation = useAtomSet(HttpClient.mutation("sessions", "create"), {
    mode: "promiseExit",
  });
  const deleteSessionMutation = useAtomSet(HttpClient.mutation("sessions", "delete"), {
    mode: "promiseExit",
  });
  const [sessionName, setSessionName] = useState("");
  const [deletingSessionId, setDeletingSessionId] = useState<string | undefined>();

  async function createSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = sessionName.trim();
    if (!name) {
      return;
    }

    const exit = await createSessionMutation({ payload: { name } });
    if (Exit.isFailure(exit)) {
      console.error("Create session failed:", Cause.pretty(exit.cause));
      return;
    }

    setSessionName("");
    refreshSessions();
    void router.navigate({
      to: "/sessions/$sessionId",
      params: { sessionId: exit.value.id },
      search: { name: exit.value.name },
    });
  }

  async function deleteSession(session: { id: string; name: string }) {
    setDeletingSessionId(session.id);
    const exit = await deleteSessionMutation({ params: { id: session.id } });
    if (Exit.isFailure(exit)) {
      setDeletingSessionId(undefined);
      console.error("Delete session failed:", Cause.pretty(exit.cause));
      return;
    }

    refreshSessions();
    setDeletingSessionId(undefined);
  }

  const sessions = AsyncResult.match(sessionsResult, {
    onInitial: () => [],
    onSuccess: (result) => result.value,
    onFailure: () => [],
  });

  return (
    <ModuleLayout>
      <ModuleLayoutHeader>
        <ModuleLayoutTitle>Sessions</ModuleLayoutTitle>
        <ModuleLayoutActions>
          <SessionCreateDialog
            name={sessionName}
            onNameChange={setSessionName}
            onSubmit={createSession}
          />
        </ModuleLayoutActions>
      </ModuleLayoutHeader>
      <ModuleLayoutBody>
        <SessionList
          sessions={sessions}
          deletingSessionId={deletingSessionId}
          onDelete={deleteSession}
        />
      </ModuleLayoutBody>
    </ModuleLayout>
  );
}
