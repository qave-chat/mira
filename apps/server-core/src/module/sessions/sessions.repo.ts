import { desc, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { Db } from "../../platform/db.contract";
import type { SessionInsertRow } from "./sessions.schema";
import { sessions } from "./sessions.table";

export class SessionsRepo extends Context.Service<SessionsRepo>()("module/SessionsRepo", {
  make: Effect.gen(function* () {
    const db = yield* Db;
    return {
      insert: Effect.fn("SessionsRepo.insert")(function* (row: SessionInsertRow) {
        yield* Effect.annotateCurrentSpan({ "session.id": row.id });
        const inserted = yield* db.query((d) => d.insert(sessions).values(row).returning());
        return inserted[0];
      }),
      listByUserId: Effect.fn("SessionsRepo.listByUserId")(function* (userId: string) {
        yield* Effect.annotateCurrentSpan({ "user.id": userId });
        return yield* db.query((d) =>
          d
            .select()
            .from(sessions)
            .where(eq(sessions.userId, userId))
            .orderBy(desc(sessions.createdAt)),
        );
      }),
      getById: Effect.fn("SessionsRepo.getById")(function* (id: string) {
        yield* Effect.annotateCurrentSpan({ "session.id": id });
        const rows = yield* db.query((d) =>
          d.select().from(sessions).where(eq(sessions.id, id)).limit(1),
        );
        return rows[0];
      }),
      deleteById: Effect.fn("SessionsRepo.deleteById")(function* (id: string) {
        yield* Effect.annotateCurrentSpan({ "session.id": id });
        const rows = yield* db.query((d) =>
          d.delete(sessions).where(eq(sessions.id, id)).returning(),
        );
        return rows[0];
      }),
    } as const;
  }),
}) {}

export const SessionsRepoLive = Layer.effect(SessionsRepo, SessionsRepo.make);
