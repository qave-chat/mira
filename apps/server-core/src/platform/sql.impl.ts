import { PgClient } from "@effect/sql-pg";
import type { SqlError } from "@effect/sql/SqlError";
import type { Layer } from "effect";
import { DbPgSsl, DbUrl } from "./db.config";

export const PgClientLive: Layer.Layer<PgClient.PgClient, unknown | SqlError> =
  PgClient.layerConfig({ url: DbUrl, ssl: DbPgSsl });
