import { desc, eq, sql } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { Db } from "../../platform/db.contract";
import type { PlanInsertRow, PlanUpdateRow } from "./plans.schema";
import { plans } from "./plans.table";

export class PlansRepo extends Context.Service<PlansRepo>()("module/PlansRepo", {
  make: Effect.gen(function* () {
    const db = yield* Db;
    return {
      insert: Effect.fn("PlansRepo.insert")(function* (row: PlanInsertRow) {
        yield* Effect.annotateCurrentSpan({ "plan.id": row.id, "session.id": row.sessionId });
        const inserted = yield* db.query((d) => d.insert(plans).values(row).returning());
        return inserted[0];
      }),
      listBySessionId: Effect.fn("PlansRepo.listBySessionId")(function* (sessionId: string) {
        yield* Effect.annotateCurrentSpan({ "session.id": sessionId });
        return yield* db.query((d) =>
          d
            .select()
            .from(plans)
            .where(eq(plans.sessionId, sessionId))
            .orderBy(desc(plans.createdAt)),
        );
      }),
      getById: Effect.fn("PlansRepo.getById")(function* (id: string) {
        yield* Effect.annotateCurrentSpan({ "plan.id": id });
        const rows = yield* db.query((d) =>
          d.select().from(plans).where(eq(plans.id, id)).limit(1),
        );
        return rows[0];
      }),
      deleteBySessionId: Effect.fn("PlansRepo.deleteBySessionId")(function* (sessionId: string) {
        yield* Effect.annotateCurrentSpan({ "session.id": sessionId });
        return yield* db.query((d) =>
          d.delete(plans).where(eq(plans.sessionId, sessionId)).returning(),
        );
      }),
      updateById: Effect.fn("PlansRepo.updateById")(function* (id: string, patch: PlanUpdateRow) {
        yield* Effect.annotateCurrentSpan({ "plan.id": id });
        const rows = yield* db.query((d) =>
          d
            .update(plans)
            .set({ ...patch, updatedAt: sql`now()` })
            .where(eq(plans.id, id))
            .returning(),
        );
        return rows[0];
      }),
    } as const;
  }),
}) {}

export const PlansRepoLive = Layer.effect(PlansRepo, PlansRepo.make);
