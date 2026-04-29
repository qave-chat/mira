import { BunRuntime } from "@effect/platform-bun";
import { desc, sql } from "drizzle-orm";
import { Console, Effect } from "effect";
import { plans } from "../module/plans/plans.table";
import { sessions } from "../module/sessions/sessions.table";
import { Db } from "./db.contract";
import { DbLive } from "./db.impl";
import { user as users } from "./auth/auth.table";

const SESSION_ID = "ses_381nfd6tRUkJ61kxHLfCsp4YjX8";
const PLAN_ID = "pla_381nfd6tRUkJ61kxHLfCsp4YjX8";
const SESSION_NAME = "Video generation smoke test";
const PHOTO_KEY = "video-generate/test/screenshot-2026-04-29-120118.png";
const PLAN_INTENT = "Create a short product walkthrough video from this screenshot.";
const PLAN_EXPLORATION = [
  {
    screenshot: PHOTO_KEY,
    reason: "Uploaded desktop screenshot for local video generation smoke test",
  },
] as const;

const program = Effect.gen(function* () {
  const db = yield* Db;
  const [user] = yield* db.query((d) =>
    d
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(1),
  );

  if (!user) {
    yield* Console.error("No auth users found. Log in locally once, then run the seed again.");
    return yield* Effect.fail("No auth users found");
  }

  yield* db.query((d) =>
    d.transaction(async (tx) => {
      await tx
        .insert(sessions)
        .values({ id: SESSION_ID, userId: user.id, name: SESSION_NAME, plan: "Draft" })
        .onConflictDoUpdate({
          target: sessions.id,
          set: {
            userId: user.id,
            name: SESSION_NAME,
            plan: "Draft",
            updatedAt: sql`now()`,
          },
        });

      await tx
        .insert(plans)
        .values({
          id: PLAN_ID,
          sessionId: SESSION_ID,
          userId: user.id,
          exploration: PLAN_EXPLORATION,
          intent: PLAN_INTENT,
        })
        .onConflictDoUpdate({
          target: plans.id,
          set: {
            sessionId: SESSION_ID,
            userId: user.id,
            exploration: PLAN_EXPLORATION,
            intent: PLAN_INTENT,
            updatedAt: sql`now()`,
          },
        });
    }),
  );

  yield* Console.log(`Seeded user: ${user.name} <${user.email}> (${user.id})`);
  yield* Console.log(`Seeded session: ${SESSION_NAME} (${SESSION_ID})`);
  yield* Console.log(`Seeded plan: ${PLAN_ID}`);
  yield* Console.log(`Seeded photo key: ${PHOTO_KEY}`);
});

BunRuntime.runMain(
  program.pipe(
    Effect.provide(DbLive),
    Effect.ensuring(Effect.sync(() => globalThis.process.exit(0))),
  ),
);
