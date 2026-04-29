import { Effect, Layer, Option, Redacted } from "effect";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { migrate as migratePg } from "drizzle-orm/postgres-js/migrator";
import { sessions } from "../module/sessions/sessions.table";
import { account, session, user, verification } from "./auth/auth.table";
import { Db, ErrorDb, type DbService } from "./db.contract";
import { DbSsl, DbUrlOptional } from "./db.config";

const schema = {
  user,
  session,
  account,
  verification,
  sessions,
};

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../drizzle",
);
const migrationsJournal = path.join(migrationsFolder, "meta/_journal.json");

const runMigrations = (migrate: () => Promise<void>) =>
  existsSync(migrationsJournal)
    ? Effect.tryPromise({
        try: migrate,
        catch: (cause) =>
          new ErrorDb({
            message: cause instanceof Error ? cause.message : String(cause),
            cause,
          }),
      })
    : Effect.logWarning("No Drizzle migration journal found, skipping migrations");

const wrap = (fn: () => unknown) =>
  Effect.tryPromise({
    try: () => Promise.resolve(fn()),
    catch: (cause) =>
      new ErrorDb({
        message: cause instanceof Error ? cause.message : String(cause),
        cause,
      }),
  });

export const makeDb = (url: string, ssl: boolean): Effect.Effect<DbService, ErrorDb, never> =>
  Effect.gen(function* () {
    const client = postgres(url, { max: 10, ssl: ssl ? "require" : false });
    const db = drizzlePg({ client, schema });
    yield* runMigrations(() => migratePg(db, { migrationsFolder }));
    return {
      client: db,
      query: (fn) => wrap(() => fn(db)) as Effect.Effect<never, ErrorDb, never>,
    } as DbService;
  });

export const makeTestDb = (): Promise<DbService> =>
  (async () => {
    const [{ PGlite }, { drizzle: drizzlePglite }, { migrate: migratePglite }] = await Promise.all([
      import("@electric-sql/pglite"),
      import("drizzle-orm/pglite"),
      import("drizzle-orm/pglite/migrator"),
    ]);
    const client = new PGlite();
    const db = drizzlePglite({ client, schema });
    if (existsSync(migrationsJournal)) {
      await migratePglite(db, { migrationsFolder });
    }
    return {
      client: db as unknown as DbService["client"],
      query: (fn) => wrap(() => fn(db)) as Effect.Effect<never, ErrorDb, never>,
    } as DbService;
  })();

export const DbLive = Layer.effect(
  Db,
  Effect.gen(function* () {
    const url = yield* DbUrlOptional;
    const ssl = yield* DbSsl;
    if (Option.isSome(url)) {
      return yield* makeDb(Redacted.value(url.value), ssl);
    }
    yield* Effect.logWarning(
      "No DB_URL or DB_HOST/… configured, using in-memory PGlite (dev only)",
    );
    return yield* Effect.promise(() => makeTestDb());
  }),
);
