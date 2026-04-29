---
name: service-test
description: House rules for service test files (*.service.test.ts) in apps/server-core. Use when adding coverage for a domain service method, asserting tagged-error branches, wiring an in-memory Db test layer, or using @effect/vitest's it.effect.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes @effect/vitest, effect, drizzle + bun:sqlite, and the service/repo/db contract split.
metadata:
  scope: apps/server-core
  prefix: ".service.test.ts"
  companion-to: ".service.impl.ts"
---

# `*.service.test.ts` — Domain service tests

Service tests are the primary test target in `server-core`. They cover
the service + repo + db stack with an **in-memory** SQLite so every test
is hermetic.

## Canonical shape

```ts
import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { Db } from "../../platform/db.contract";
import { makeDb } from "../../platform/db.impl";
import { SessionsRepoLive } from "./sessions.repo.impl";
import { SessionsService } from "./sessions.service.contract";
import { SessionsServiceLive } from "./sessions.service.impl";

const TestDbLive = Layer.sync(Db, () => makeDb(":memory:"));

const TestLive = SessionsServiceLive.pipe(
  Layer.provide(SessionsRepoLive),
  Layer.provide(TestDbLive),
);

const provide = <A, E>(effect: Effect.Effect<A, E, SessionsService>) =>
  effect.pipe(Effect.provide(TestLive));

describe("SessionsService", () => {
  it.effect("create generates id and createdAt", () =>
    provide(
      Effect.gen(function* () {
        const service = yield* SessionsService;
        const session = yield* service.create({ userId: "u1", expiresAt: 5000 });
        expect(session.id).toBeTruthy();
      }),
    ),
  );
});
```

## Do

- Use `@effect/vitest`'s `it.effect(name, () => Effect<...>)` — **not**
  plain `it(name, async () => ...)`. This wires the Effect runtime and
  fiber for you.
- Provide `Db` with `makeDb(":memory:")` wrapped in `Layer.sync`. Each
  test gets a fresh database because the layer is re-run per test when
  you `Effect.provide(TestLive)` at the leaf.
- Cover every branch of every tagged error with `Effect.flip` + an
  `instanceof` narrowing:

  ```ts
  const error = yield* service.update({ id: "nope", ... }).pipe(Effect.flip)
  if (!(error instanceof ErrorSessionNotFound)) throw new Error(...)
  expect(error._tag).toBe("ErrorSessionNotFound")
  ```

- Assert the `_tag` on every tagged error — that's the wire
  discriminator.

## Don't

- Don't mock the repo to test the service. The repo is cheap (in-memory
  SQLite) and mocking diverges from prod — we got burned by that before
  in similar codebases.
- Don't share `Db` instances across tests. A new `makeDb(":memory:")`
  per test prevents state leakage.
- Don't `await` Effects — always `yield*` them in an `Effect.gen`.
- Don't import `*.impl.ts` for types — import from `*.contract.ts`.

## Where it lives

Next to the service impl: `<feature>.service.impl.ts` +
`<feature>.service.test.ts` in the same directory.

## Lint rules that apply

- `effect-local/require-companion-test` — every `*.service.impl.ts`
  must have a `*.service.test.ts` sibling.
- Effect-discipline rules (all **on**). Note: the `throw new Error(...)`
  in the narrowing pattern above currently trips `no-throw`; wrap it
  with a `// oxlint-disable-next-line effect-local/no-throw -- test narrowing`
  comment until we migrate to `Schema.is` + `Effect.fail`.
