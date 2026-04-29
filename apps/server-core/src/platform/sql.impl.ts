import { PgClient } from "@effect/sql-pg";
import { DbPgSsl, DbUrl } from "./db.config";

export const PgClientLive = PgClient.layerConfig({ url: DbUrl, ssl: DbPgSsl });
