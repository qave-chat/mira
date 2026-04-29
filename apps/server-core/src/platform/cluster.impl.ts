import { Config, Effect, Layer, Redacted } from "effect";
import { SqlClient } from "effect/unstable/sql";
import { SingleRunner } from "effect/unstable/cluster";
import { PgClient } from "@effect/sql-pg";
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

const PlatformPgClientLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    yield* sql`CREATE SCHEMA IF NOT EXISTS ${sql(PLATFORM_SCHEMA)}`;
  }),
).pipe(Layer.provideMerge(PgClient.layerConfig({ url: platformUrl, ssl: DbPgSsl })));

export const SingleRunnerLive = SingleRunner.layer({ runnerStorage: "sql" }).pipe(
  Layer.provide(PlatformPgClientLive),
);
