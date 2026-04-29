import { Button } from "@/shared/ui/button.ui";
import { ModuleLayoutTitle } from "@/shared/ui/module-layout.ui";

export type SessionDetailProps = {
  sessionId: string;
  onGenerateVideo: () => void;
};

export function SessionDetail({ sessionId, onGenerateVideo }: SessionDetailProps) {
  return (
    <section
      data-slot="session-detail"
      className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <ModuleLayoutTitle className="text-lg">Session {sessionId}</ModuleLayoutTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Session details will appear here once sessions are backed by data.
          </p>
        </div>
        <Button type="button" onClick={onGenerateVideo}>
          Generate video
        </Button>
      </div>
    </section>
  );
}
