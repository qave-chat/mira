import { Context, Effect, Schema } from "effect";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import type { plans } from "../module/plans/plans.table";
import type { sessions } from "../module/sessions/sessions.table";
import type { account, session, user, verification } from "./auth/auth.table";

export class ErrorDb extends Schema.TaggedErrorClass<ErrorDb>()("ErrorDb", {
  message: Schema.String,
  cause: Schema.Defect,
}) {}

export type DbSchema = {
  user: typeof user;
  session: typeof session;
  account: typeof account;
  verification: typeof verification;
  sessions: typeof sessions;
  plans: typeof plans;
};
export type DbClient = PgDatabase<PgQueryResultHKT, DbSchema>;

export interface DbService {
  readonly client: DbClient;
  readonly query: <A>(fn: (db: DbClient) => A | Promise<A>) => Effect.Effect<Awaited<A>, ErrorDb>;
}

export class Db extends Context.Service<Db, DbService>()("platform/Db") {}
