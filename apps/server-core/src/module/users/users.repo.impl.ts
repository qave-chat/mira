import { Effect, Layer } from "effect";
import { eq } from "drizzle-orm";
import { Db } from "../../platform/db.contract";
import { user } from "../../platform/auth/auth.table";
import { UsersRepo } from "./users.repo.contract";
import type { User } from "./users.schema";

const selection = {
  id: user.id,
  name: user.name,
  email: user.email,
} as const;

export const UsersRepoLive = Layer.effect(
  UsersRepo,
  Effect.gen(function* () {
    const db = yield* Db;
    return UsersRepo.of({
      upsert: Effect.fn("UsersRepo.upsert")(function* (input: User) {
        yield* Effect.annotateCurrentSpan({ "user.id": input.id });
        yield* db.query((d) =>
          d
            .insert(user)
            .values({
              id: input.id,
              name: input.name,
              email: input.email,
              emailVerified: false,
            })
            .onConflictDoUpdate({
              target: user.id,
              set: { name: input.name, email: input.email },
            }),
        );
        return input;
      }),
      get: Effect.fn("UsersRepo.get")(function* (id) {
        yield* Effect.annotateCurrentSpan({ "user.id": id });
        const rows = yield* db.query((d) =>
          d.select(selection).from(user).where(eq(user.id, id)).limit(1),
        );
        return rows[0];
      }),
      list: Effect.fn("UsersRepo.list")(function* () {
        return yield* db.query((d) => d.select(selection).from(user));
      }),
      delete: Effect.fn("UsersRepo.delete")(function* (id) {
        yield* Effect.annotateCurrentSpan({ "user.id": id });
        yield* db.query((d) => d.delete(user).where(eq(user.id, id)));
      }),
    });
  }),
);
