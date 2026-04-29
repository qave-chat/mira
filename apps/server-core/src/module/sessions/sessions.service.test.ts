import { assert, describe, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { Db } from "../../platform/db.contract";
import { makeTestDb } from "../../platform/db.impl";
import { SessionsRepoLive } from "./sessions.repo";
import { ErrorSessionNotFound } from "./sessions.error";
import { SessionsService, SessionsServiceLive } from "./sessions.service";

const TestDbLive = Layer.effect(
  Db,
  Effect.promise(() => makeTestDb()),
);

const TestLive = SessionsServiceLive.pipe(
  Layer.provide(SessionsRepoLive),
  Layer.provide(TestDbLive),
);

const provide = <A, E>(effect: Effect.Effect<A, E, SessionsService>) =>
  effect.pipe(Effect.provide(TestLive));

describe("SessionsService", () => {
  it.effect("creates and lists persisted sessions", () =>
    provide(
      Effect.gen(function* () {
        const service = yield* SessionsService;
        const session = yield* service.create({ userId: "usr_test", name: "Launch demo" });
        const sessions = yield* service.list("usr_test");

        assert.match(session.id, /^ses_[0-9A-Za-z]{27}$/);
        assert.strictEqual(session.name, "Launch demo");
        assert.strictEqual(session.plan, "Draft");
        assert.strictEqual(sessions.length, 1);
        assert.strictEqual(sessions[0]?.id, session.id);
      }),
    ),
  );

  it.effect("does not return sessions owned by another user", () =>
    provide(
      Effect.gen(function* () {
        const service = yield* SessionsService;
        const session = yield* service.create({ userId: "usr_owner", name: "Private demo" });
        const error = yield* service.get({ id: session.id, userId: "usr_other" }).pipe(Effect.flip);

        assert.instanceOf(error, ErrorSessionNotFound);
        assert.strictEqual(error._tag, "ErrorSessionNotFound");
      }),
    ),
  );
});
