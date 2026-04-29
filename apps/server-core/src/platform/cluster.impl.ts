import { Config, Effect, Layer, Redacted } from "effect";
import { SingleRunner } from "effect/unstable/cluster";
import { PgClient } from "@effect/sql-pg";
import postgres from "postgres";
import { DbPgSsl, DbUrl } from "./db.config";

const PLATFORM_SCHEMA = "platform";

const platformUrl = DbUrl.pipe(
  Config.map((url) => {
    const raw = Redacted.value(url);
    const sep = raw.includes("?") ? "&" : "?";
    const opts = encodeURIComponent(`-c search_path=${PLATFORM_SCHEMA},public`);
    return Redacted.make(`${raw}${sep}options=${opts}`);
  }),
);

const PlatformSchemaLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const url = yield* DbUrl;
    const ssl = yield* DbPgSsl;
    yield* Effect.tryPromise({
      try: async () => {
        const sql = postgres(Redacted.value(url), { max: 1, ssl: ssl ? "require" : false });
        await sql.unsafe(`CREATE SCHEMA IF NOT EXISTS ${PLATFORM_SCHEMA}`);
        await sql.end();
      },
      catch: (cause) => cause,
    });
  }),
);

export const SingleRunnerLive = SingleRunner.layer({ runnerStorage: "sql" }).pipe(
  Layer.provide(PgClient.layerConfig({ url: platformUrl, ssl: DbPgSsl })),
  Layer.provideMerge(PlatformSchemaLive),
);
