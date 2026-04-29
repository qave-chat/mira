---
name: repo
description: House rules for repository files (*.repo.ts) in apps/server-core. Use when persisting a feature's data with Drizzle, wrapping queries inside the Db service, handling ErrorDb, or deciding which operations belong in the repo vs the service.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes drizzle-orm, the platform/Db service, and the effect-local oxlint plugin.
metadata:
  scope: apps/server-core
  prefix: ".repo.ts"
---

# `*.repo.ts` — Persistence

A repo is the **persistence** layer. Its job is to wrap Drizzle queries
so the service only sees typed `Effect`-returning methods and doesn't
touch SQL directly.

## The file

One file per repo — `Context.Service` with the `make` option infers the
method shape (and `ErrorDb` in each method's error channel) from the
constructor effect. Tag, impl, and Live layer in one place.

```ts
// sessions.repo.ts
import { Context, Effect, Layer } from "effect";
import { Db } from "../../platform/db.contract";
import type { Session, SessionListQuery, SessionRow } from "./sessions.schema";
import { sessions } from "./sessions.table";

export class SessionsRepo extends Context.Service<SessionsRepo>()("module/SessionsRepo", {
  make: Effect.gen(function* () {
    const db = yield* Db;
    return {
      insert: Effect.fn("SessionsRepo.insert")(function* (row: SessionRow) {
        yield* Effect.annotateCurrentSpan({ "session.id": row.id });
        yield* db.query((d) => d.insert(sessions).values(row));
      }),
      get: Effect.fn("SessionsRepo.get")(function* (id: string) {
        yield* Effect.annotateCurrentSpan({ "session.id": id });
        return yield* db.query((d) => /* drizzle query */);
      }),
      // ...
    } as const;
  }),
}) {}

export const SessionsRepoLive = Layer.effect(SessionsRepo, SessionsRepo.make);
```

## Conventions

- Repo id: `module/<Name>Repo`.
- Pull the `Db` service once at the top of `make`. Every operation goes
  through `db.query((d) => ...)`.
- Wrap every method with `Effect.fn("<Name>Repo.<op>")` so each
  persistence call becomes its own span. Annotate the current span with
  identifying attributes (e.g. `"session.id"`) before issuing the
  query — this is the repo's whole contribution to observability.
- Return the raw row shape (or `undefined` / `ReadonlyArray`) — the
  service maps to domain types / errors.
- `ErrorDb` is **inferred** from `db.query` calls; don't annotate it by
  hand. `as const` on the returned object preserves method literal types.
- End the file with `export const <Name>RepoLive = Layer.effect(<Name>Repo, <Name>Repo.make);`.

## Do

- Keep the method surface tiny — one method per persistence operation
  the service actually uses.
- Keep the `*.table.ts` import confined to this file.

## Don't

- Don't expose domain errors (`ErrorSessionNotFound`). The service turns
  a missing row into a domain error.
- Don't run business logic in the repo. `insert` is just
  `d.insert(...)`, not "insert + do five other things".
- Don't call `db.query` outside of a repo — services use the repo, not
  `Db` directly.
- Don't import another module's repo. If you need data across modules,
  that's a service-level concern.
- Don't re-introduce a `.contract.ts` / `.impl.ts` split. Persistence
  has one implementation; the tag and impl belong together.

## Where it lives

`src/module/<feature>/<feature>.repo.ts`.

## Testing

Repos are covered by the service tests (`<feature>.service.test.ts`)
with an in-memory `Db` layer. A separate repo test file is only
warranted for non-trivial SQL (joins, transactions, constraints).

## Lint rules that apply

- Module-wide Effect discipline (all **on**).
- No direct exposure of `DbClient` / drizzle types outside the repo.
