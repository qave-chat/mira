---
name: state
description: House rules for picking a state-management primitive in apps/client-ui. Use when deciding between Effect atoms, React useState, TanStack Router search params, Effect Layers/services, localStorage, or form libraries. Read before introducing a new piece of state, a new atom, a new context, or a new ref.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes React 19, Effect atoms (effect/unstable/reactivity), TanStack Router, and @effect/atom-react.
metadata:
  scope: apps/client-ui
---

# Picking a state primitive

Atoms are powerful but not the default. The same app will usually want
**five** different state tools used for five different reasons. Reach for
the smallest one that covers the requirement.

## Decision table

| Kind of state                                 | Example                                             | Use                                                                                                                |
| --------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Server data (async, cacheable, invalidatable) | session list, user profile                          | **Atom** via `RpcClient.query` / `HttpClient`                                                                      |
| Mutations that return a typed result          | sign-out, create session                            | **Atom** via `.mutation(...)` + `useAtomSet` with `{ mode: "promiseExit" }`                                        |
| Cross-component shared client state           | current user, feature flags, theme, connection mode | **Atom** (`Atom.make`, `Atom.subscriptionRef`)                                                                     |
| URL-backed state                              | filters, tabs, pagination, active id                | **TanStack Router search params** (`validateSearch` + `Route.useSearch` + `navigate`) — **not** `Atom.searchParam` |
| Persisted client state (localStorage)         | sidebar collapsed, last-used tab                    | **Atom.kvs**                                                                                                       |
| Derivation over multiple atoms                | filteredSessions, canEdit                           | **Atom.map** / `Atom.make((get) => …)`                                                                             |
| Truly local UI state (per-mount, ephemeral)   | modal open, hover, input draft, focused row         | **React.useState / useReducer**                                                                                    |
| Long-lived resource with dependencies         | WebSocket client, logger, LLM client                | **Effect Layer** — expose via a service, consume from atoms where needed                                           |
| Form state (many fields, validation, submit)  | login form, session editor                          | **Form library** (TanStack Form / RHF) — per-field atoms is over-engineering                                       |

**Rule of thumb:** if more than one component reads/writes it, or if it has
a non-trivial async/derivation story, atom it. Otherwise `useState`.

## Where each lives

- Server-backed atoms and shared client atoms → `module/<feature>/<feature>.atom.ts`.
- Derivations that span features → `shared/atom/<name>.atom.ts`.
- URL state → declared on the route file itself via `validateSearch`.
- Layers/services → `module/<feature>/<feature>.service.ts` (or a shared provider).
- Local UI state → inline `useState` inside the `.ui.tsx` or `.hook.ts`.

## Do

- **Co-locate atoms with the feature.** `module/session/session.atom.ts`.
  Derivations stay in the same file unless they're shared across modules.
- **Keep `.atom.ts` files data-only.** No hooks, no JSX, no router. Export
  named atoms (`sessionListAtom`, `selectedUserAtom`).
- **Suffix atom exports with `Atom`.** Enforced by
  `effect-local/atom-export-suffix`. Exempts `*Client` / `*Service` class
  declarations (e.g. `RpcClient`, `HttpClient`).
- **Derive with `Atom.map` when it's a pure 1:1 projection, `Atom.make((get) => …)`
  when you need to read multiple atoms.**
- **For mutations, always `{ mode: "promiseExit" }`** + branch on
  `Exit.isSuccess` / `Exit.isFailure`. Enforced by
  `effect-local/prefer-promise-exit`.

## Don't

- **Don't use `Atom.searchParam`.** It fights TanStack Router over the URL
  (writes through `history.pushState` bypassing the router; router writes
  bypass the atom's listener). Use the route's `validateSearch` + typed
  search params instead. Enforced by `effect-local/no-atom-searchparam`.
- **Don't atom-ify every `useState`.** A modal's open/closed, a hover
  state, an input draft — these are per-mount and don't belong in a
  module-scoped atom.
- **Don't put form state in per-field atoms.** Use a form library.
- **Don't build singletons-with-deps as atoms.** A WebSocket client, a DB
  pool, a client SDK — those are Effect services declared in a Layer and
  wired into a `ManagedRuntime` once.
- **Don't re-create a server-backed atom inside a hook when it's shared.**
  `RpcClient.query(...)` is memoized via `Atom.family`, so calling it
  inside a component works, but when multiple components need the same
  query, hoist it to `<feature>.atom.ts` so there's one import site.

## Rules of thumb

- **Start with `useState`. Promote to an atom when a second consumer
  appears.** Premature atom-ification is the most common mistake.
- **URL first when the state is semantically navigable.** If a user could
  reasonably bookmark or share the state (a filter, a tab, an id), the URL
  is the right store — the atom graph is the wrong store.
- **Derivation costs ~nothing until rendered.** Don't over-split
  derivations into four atoms "for performance"; collapse to one view
  atom when the derivations are all consumed together.
- **Services (Layer) and atoms compose.** An atom can build itself from
  an `Effect` that depends on services — `Atom.make(Effect.gen(function*()
{ const svc = yield* Svc; ... }))`. Use this to call into your Effect
  infra without exposing the service in React.

## When you still aren't sure

Describe the state in one sentence:

1. "Only this one component cares and it resets on close" → `useState`.
2. "User should be able to bookmark/share this" → router search param.
3. "Survives page reload" → `Atom.kvs`.
4. "Two unrelated components need to read/write it" → `Atom.make`.
5. "It's the result of a server call and may be invalidated" → RPC/HTTP atom.
6. "It's a long-lived resource that depends on config/other services" →
   Effect Layer, consumed from atoms as needed.

## Lint rules that apply

- `effect-local/no-atom-searchparam`
- `effect-local/atom-export-suffix`
- `effect-local/prefer-promise-exit`
- `effect-local/require-companion-test` (on `.atom.ts` files)
