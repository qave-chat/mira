import { assert, describe, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { Db } from "../../platform/db.contract";
import { makeTestDb } from "../../platform/db.impl";
import { PlansRepoLive } from "./plans.repo";
import { ErrorPlanNotFound } from "./plans.error";
import { PlansService, PlansServiceLive } from "./plans.service";
import { SessionsRepoLive } from "../sessions/sessions.repo";
import { SessionsService, SessionsServiceLive } from "../sessions/sessions.service";

const TestDbLive = Layer.effect(
  Db,
  Effect.promise(() => makeTestDb()),
);

const TestSessionsLive = SessionsServiceLive.pipe(Layer.provide(SessionsRepoLive));

const TestPlansLive = PlansServiceLive.pipe(
  Layer.provide(PlansRepoLive),
  Layer.provide(TestSessionsLive),
);

const TestLive = Layer.mergeAll(TestPlansLive, TestSessionsLive).pipe(Layer.provide(TestDbLive));

const provide = <A, E>(effect: Effect.Effect<A, E, PlansService | SessionsService>) =>
  effect.pipe(Effect.provide(TestLive));

describe("PlansService", () => {
  it.effect("creates multiple plans for a session newest first", () =>
    provide(
      Effect.gen(function* () {
        const sessions = yield* SessionsService;
        const plans = yield* PlansService;
        const session = yield* sessions.create({ userId: "usr_test", name: "Launch demo" });
        const first = yield* plans.create({
          sessionId: session.id,
          userId: "usr_test",
          exploration: [{ screenshot: "s3://first", reason: "Initial source" }],
          title: "Product teaser",
          intent: "Make a product teaser",
        });
        const second = yield* plans.create({
          sessionId: session.id,
          userId: "usr_test",
          exploration: [{ screenshot: "s3://second", reason: "Better framing" }],
          title: "Launch video",
          intent: "Make a concise launch video",
        });
        const list = yield* plans.list({ sessionId: session.id, userId: "usr_test" });

        assert.match(first.id, /^pla_[0-9A-Za-z]{27}$/);
        assert.strictEqual(list.length, 2);
        assert.strictEqual(list[0]?.id, second.id);
        assert.strictEqual(list[1]?.id, first.id);
        assert.strictEqual(list[0]?.intent, "Make a concise launch video");
      }),
    ),
  );

  it.effect("gets a plan by id for its owner", () =>
    provide(
      Effect.gen(function* () {
        const sessions = yield* SessionsService;
        const plans = yield* PlansService;
        const session = yield* sessions.create({ userId: "usr_owner", name: "Private demo" });
        const plan = yield* plans.create({
          sessionId: session.id,
          userId: "usr_owner",
          exploration: [{ screenshot: "s3://shot", reason: "Hero moment" }],
          title: "Workflow demo",
          intent: "Show the workflow",
        });
        const fetched = yield* plans.get({ id: plan.id, userId: "usr_owner" });

        assert.strictEqual(fetched.id, plan.id);
        assert.strictEqual(fetched.exploration[0]?.reason, "Hero moment");
      }),
    ),
  );

  it.effect("does not return plans owned by another user", () =>
    provide(
      Effect.gen(function* () {
        const sessions = yield* SessionsService;
        const plans = yield* PlansService;
        const session = yield* sessions.create({ userId: "usr_owner", name: "Private demo" });
        const plan = yield* plans.create({
          sessionId: session.id,
          userId: "usr_owner",
          exploration: [{ screenshot: "s3://shot", reason: "Hero moment" }],
          title: "Workflow demo",
          intent: "Show the workflow",
        });
        const error = yield* plans.get({ id: plan.id, userId: "usr_other" }).pipe(Effect.flip);

        assert.instanceOf(error, ErrorPlanNotFound);
        assert.strictEqual(error._tag, "ErrorPlanNotFound");
      }),
    ),
  );
});
