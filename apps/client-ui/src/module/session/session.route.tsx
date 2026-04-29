import type { FormEvent } from "react";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
  const [sessions, setSessions] = useState<Array<{ id: string; name: string; plan: string }>>([]);
  const [sessionName, setSessionName] = useState("");

  function createSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = sessionName.trim();
    if (!name) {
      return;
    }

    setSessions((currentSessions) => [
      {
        id: crypto.randomUUID(),
        name,
        plan: "Draft",
      },
      ...currentSessions,
    ]);
    setSessionName("");
  }

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
        <SessionList sessions={sessions} />
      </ModuleLayoutBody>
    </ModuleLayout>
  );
}
