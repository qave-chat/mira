---
name: module
description: General patterns for composing feature modules under src/module/<feature>/ in apps/client-ui. Use when creating a new feature folder, mirroring a client module with its server-core counterpart, registering routes in src/routes.ts, choosing where a file belongs (shared vs module), or reviewing cross-module dependencies.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes @tanstack/virtual-file-routes and the @mira/server-core RPC contract.
metadata:
  scope: apps/client-ui
  prefix: "module/<feature>/"
---

# `module/<feature>/` — Feature modules

A **module** is a vertical slice of a single feature: its data source, its
routes, and its feature-local UI. Modules are the unit of ownership — you
can rip one out or rewrite it without touching another.

## When to create a module

- A new server-backed resource the UI needs to list / create / edit
  (`module/session`, `module/user`, …).
- A coherent UI area with its own routes (`module/settings`,
  `module/billing`).

If you only need to share a hook / util / primitive, it belongs in
`shared/`, not in a module.

## Anatomy

A module is a folder under `src/module/` named after the feature
(singular):

```
src/module/<feature>/
  <feature>.atom.ts | <feature>.atom-rpc.ts   ← data: RPC client + atoms
  <feature>.route.tsx                          ← one file per URL the module owns
  <feature>.ui.tsx                             ← feature-local views, if any
  <sub>.hook.ts                                ← feature-local hooks, if any
  <sub>.util.ts                                ← feature-local utils, if any
  *.test.{ts,tsx}                              ← colocated tests
```

Each file still follows its prefix convention — read the matching skill
(`skills/<prefix>/SKILL.md`) for that file type.

## Do

- **One RPC client per module.** Declare `<feature>.atom-rpc.ts` with
  `AtomRpc.Service<T>()("client-ui/<feature>/<Name>Client", {...})`.
- **Queries declare `reactivityKeys`.** Mutations on the same keys
  invalidate subscribed atoms. Pick keys that name the resource shape
  (`["sessions"]`, `["sessions", id]`).
- **Route is thin.** Pull data from the module's atoms, render via
  `.ui.tsx` components. Loading / error branches use `AsyncResult.match`.
- **Cross-module dependencies go one direction**: feature → `shared/*`.
  Never feature → another feature. Hoist shared code to `shared/` or to a
  new shared module.
- **Name the atoms after verbs + nouns**: `sessionsAtom` (query),
  `createSession` / `updateSession` / `deleteSession` (mutations).

## Don't

- Don't share types by reaching into `../<other-feature>/...`. Import
  from `@mira/server-core/rpc` (the contract is the shared type surface).
- Don't create a client per atom. One `AtomRpc.Service` per module,
  reused.
- Don't put business logic in the `*.route.tsx`. Move it into a
  `.util.ts` or into an atom/service inside the module.
- Don't let a module grow past the prefix conventions. If you reach for
  something that doesn't fit `.atom | .route | .ui | .hook | .util`, you
  either need a new prefix (add a skill + lint rule) or you're putting
  server-side logic in the client.

## Route registration

Every route file must be listed in `src/routes.ts`:

```ts
export const routes = rootRoute("app.route.tsx", [
  route("/session", "module/session/session.route.tsx"),
  route("/<next>", "module/<next>/<next>.route.tsx"),
]);
```

The TanStack `virtualRouteConfig` resolves paths relative to `./src`.

## Mirrors on the server

Feature modules on the client
(`apps/client-ui/src/module/<feature>`) have a sibling on the server
(`apps/server-core/src/module/<feature>`) that owns
`*.rpc.contract.ts`, `*.rpc.impl.ts`, `*.service.ts`, `*.repo.ts`,
`*.schema.ts`, `*.table.ts`, `*.error.ts`. The names match across apps —
pick the same folder name on both sides when you add a new feature.

## Testing

- `*.atom.test.ts` — provide a stub RPC layer, drive through
  `AsyncResult` states, assert reactivity keys invalidate on mutation.
- `*.route.test.tsx` — render with a memory router, assert component
  output for each atom state.
- `*.ui.test.tsx` — snapshot / DOM checks of feature-local components.

Cross-cutting integration tests (real HTTP, real DB) live in
`apps/server-core` under the server module, not here.
