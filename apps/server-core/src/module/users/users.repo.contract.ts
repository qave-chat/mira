import { Context, Effect } from "effect";
import type { ErrorDb } from "../../platform/db.contract";
import type { User } from "./users.schema";

export class UsersRepo extends Context.Service<
  UsersRepo,
  {
    readonly upsert: (input: User) => Effect.Effect<User, ErrorDb>;
    readonly get: (id: string) => Effect.Effect<User | undefined, ErrorDb>;
    readonly list: () => Effect.Effect<ReadonlyArray<User>, ErrorDb>;
    readonly delete: (id: string) => Effect.Effect<void, ErrorDb>;
  }
>()("module/UsersRepo") {}
