---
name: atom
description: House rules for Effect atom files (*.atom.ts / *.atom-rpc.ts) in apps/client-ui. Use when wiring an AtomRpc.Service for a feature module, defining queries and mutations against the shared ApiGroup contract, picking reactivityKeys for mutation invalidation, or testing atom lifecycle.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes effect (effect/unstable/reactivity, effect/unstable/rpc, effect/unstable/http) and @mira/server-core's RPC contract.
metadata:
  scope: apps/client-ui
  prefix: ".atom.ts | .atom-rpc.ts"
---

# `*.atom.ts` — Reactive data sources

A `.atom.ts` (or `.atom-rpc.ts`) file holds Effect **atoms** — the bridge
between the server and the React view layer. Atoms own lifecycle,
caching, and reactivity keys; views just read them.

## When to use

- A server-backed query or mutation the UI subscribes to.
- A long-lived client derivation that's shared across components (auth
  user, feature flags) — but prefer services when possible.

## Do

- Build against the shared `ApiGroup` from `@mira/server-core/rpc`.
- For server-backed modules use `AtomRpc.Service<T>()(...)` and declare
  `reactivityKeys` on each `query` so mutations can invalidate them.
- Keep the file **data-only**: atom definitions, `query` / `mutation`
  wrappers. No JSX, no hooks, no router.
- Export atoms as named constants (`sessionsAtom`, `createSession`).

### Canonical shape

```ts
import { AtomRpc } from "effect/unstable/reactivity";
import { ApiGroup, rpcProtocolLayer } from "@mira/client-api/rpc";

export class SessionClient extends AtomRpc.Service<SessionClient>()(
  "client-ui/session/SessionClient",
  { group: ApiGroup, protocol: rpcProtocolLayer("/api/rpc") },
) {}
```

The service ID must include `client-ui/<feature>/` so it doesn't collide
across modules. Transport wiring (HTTP + JSON + fetch) lives once in
`@mira/client-api/rpc` — don't re-declare `RpcClient.layerProtocolHttp` per
module.

## Don't

- Don't do side effects at module load — just declare atoms.
- Don't read atoms here. That's the consumer's job (a hook or a route).
- Don't leak the RPC client — expose atoms / mutations, not the client.

## Where it lives

`src/module/<feature>/<feature>.atom.ts` — one atom file per feature. RPC
wiring belongs in `<feature>.atom-rpc.ts` if you want to split
declaration from transport wiring.

## Testing

Co-locate `<name>.atom.test.ts`. Provide a stub RPC layer with
`Layer.succeed` against the contract, subscribe via a test registry, then
assert the atom walks through `Initial → Success` / `Failure`. Mutations
are tested by driving them through a registry and asserting the
reactivity key triggers invalidation.

## Lint rules that apply

- `effect-local/require-companion-test`.
- Full Effect discipline: `no-throw`, `no-new-date`, `no-math-random`,
  `no-json-parse` all **on**.
