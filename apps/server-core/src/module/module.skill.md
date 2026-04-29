---
name: module
description: General patterns for composing feature modules under src/module/<feature>/ in apps/server-core. Use when creating a new backend feature (RPC + service + repo + schema + table + error), mirroring a client-ui module, wiring it into main.ts, or reviewing cross-module dependencies.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes effect@beta, @effect/platform-bun, drizzle-orm, and the effect-local oxlint plugin.
metadata:
  scope: apps/server-core
  prefix: "module/<feature>/"
---

# `module/<feature>/` — Server modules

A server module is a vertical slice of one backend feature: its wire
format (RPC), its domain service, its persistence, its database shape,
and its errors. Modules are the unit of ownership — each file has a
single responsibility and is replaceable independently.

## Anatomy

```
src/module/<feature>/
  <feature>.rpc.contract.ts       ← Rpc.make + RpcGroup — wire format
  <feature>.rpc.impl.ts           ← RpcGroup.toLayer — bind rpcs to service
  <feature>.service.ts            ← Context.Service + Live layer (tag, impl, domain errors)
  <feature>.repo.ts               ← Context.Service + Live layer for persistence
  <feature>.schema.ts             ← Schema.Struct — domain types
  <feature>.table.ts              ← Drizzle pgTable
  <feature>.util.ts               ← pure deterministic business helpers, if any
  <feature>.util.test.ts          ← tests for every exported util function, if any
  <feature>.service.test.ts       ← @effect/vitest service tests
```

## The contract/impl rule

The `.contract.ts` / `.impl.ts` split is reserved for boundaries that
actually cross one:

- **`.rpc.contract.ts` / `.rpc.impl.ts`** — RPC is a wire contract
  consumed by `packages/client-api` and surfaced to the browser. The
  contract file holds `Rpc.make` / `RpcGroup.make` (types + schemas
  only); the impl holds `RpcGroup.toLayer`.
- **`platform/*.contract.ts` / `platform/*.impl.ts`** — platform ports
  (`Db`, `Ec2`, `Auth`, `Http`, `Rpc`) where the port may have multiple
  implementations (real vs. test, pg vs. pglite, etc.) and consumers
  depend on the interface.

Service and repo do **not** get a split. They have one implementation,
their shape is fully captured by `Context.Service` with the `make`
option, and the `Live` layer lives in the same file. Keep tag + impl
together; let errors be inferred from `Effect.gen`.

## Do

- One RPC group per module. Merge them all in
  `platform/rpc.contract.ts` under `ApiGroup`.
- One `SessionsService`-style service per module, plus at most one
  `SessionsRepo` for persistence.
- Every service method is named and traced:
  `Effect.fn("<Service>.<method>")(function*() {...}, withModuleLogs)`.
- Catch `ErrorDb` in the rpc.impl boundary and `Effect.die` — the wire
  contract shouldn't surface infrastructure errors.
- Register the module's Live layers in `src/main.ts` under `Handlers`.

## Don't

- Don't re-introduce a `.contract.ts` / `.impl.ts` split for service or
  repo. One file each — see the `service` and `repo` skills.
- Don't import another module's service/repo internals — import the
  exported class and `Live` layer from `./<feature>.service` /
  `./<feature>.repo`.
- Don't import `*.table.ts` outside the module's own repo.
- Don't throw — use `TaggedErrorClass` + `Effect.fail`. The
  `effect-local/no-throw` rule is on in this app. Tagged error classes
  must be named `Error<Entity><Reason>` with a matching tag string
  (`effect-local/tagged-error-name`).
- Don't use `new Date()` or `Math.random()` — use `Clock`, `DateTime`,
  `Random`. `Date.now()` and `crypto.randomUUID()` are currently
  tolerated at service boundaries (see `sessions.service.impl.ts`),
  but prefer moving to `Clock` / `Random` when touching.

## Mirrors on the client

Every server module has a matching folder on the client under
`apps/client-ui/src/module/<feature>`. The feature name must match. When
you add / rename / delete a server module, do the same on the client in
the same PR.

## Platform layer

Cross-module infrastructure (`Db`, `Ec2`, `Auth`, RPC transport,
workflow/cluster engines) lives under `src/platform/`, not `module/`.
Platform ports keep the `.contract.ts` / `.impl.ts` split so multiple
impls can share a tag — see `platform/db.contract.ts` +
`platform/db.impl.ts`.

## Wiring the app

`src/main.ts` merges handler layers, provides services, provides
infrastructure, runs with `BunRuntime.runMain`:

```ts
const Handlers = Layer.mergeAll(HealthLive, SessionsLive).pipe(
  Layer.provide(SessionsServiceLive),
  Layer.provide(SessionsRepoLive),
  Layer.provide(DbLive),
);
```

`SessionsServiceLive` and `SessionsRepoLive` are the `Live` layer exports
from `./<feature>.service` / `./<feature>.repo`. Add a new module by
adding its `<Name>Live` handler to `Handlers` and providing its service

- repo `Live` layers.
