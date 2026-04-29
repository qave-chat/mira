import { Link } from "@tanstack/react-router";

export type SessionListItem = {
  id: string;
  name: string;
  plan: string;
};

export type SessionListProps = {
  sessions: ReadonlyArray<SessionListItem>;
};

export function SessionList({ sessions }: SessionListProps) {
  return (
    <section
      data-slot="session-list"
      className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm"
    >
      <div data-slot="session-list-header" className="border-b p-6">
        <h2 className="text-lg font-semibold">Recent sessions</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Review planned and recently created sessions.
        </p>
      </div>
      <div data-slot="session-list-table-wrap" className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-6 py-3 font-medium">Name</th>
              <th className="px-6 py-3 font-medium">Plan</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <tr
                  key={session.id}
                  data-slot="session-list-row"
                  className="transition-colors hover:bg-muted/30"
                >
                  <td className="px-6 py-4 font-medium">
                    <Link
                      to="/sessions/$sessionId"
                      params={{ sessionId: session.id }}
                      search={{ name: session.name }}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {session.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full border px-2 py-1 text-xs font-medium">
                      {session.plan}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr data-slot="session-list-empty">
                <td colSpan={2} className="px-6 py-10 text-center text-muted-foreground">
                  No sessions yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
