---
name: rpc
description: House rules for RPC files (*.rpc.contract.ts + *.rpc.impl.ts) in apps/server-core. Use when adding a new RPC endpoint, defining request/response schemas with Rpc.make, wiring handlers with RpcGroup.toLayer, or exposing a feature through ApiGroup to the client.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes effect/unstable/rpc, Effect Schema, and the effect-local oxlint plugin.
metadata:
  scope: apps/server-core
  prefix: ".rpc.contract.ts | .rpc.impl.ts"
---

# `*.rpc.contract.ts` / `*.rpc.impl.ts` — RPC wire format

An RPC pair is the contract between `server-core` and `client-ui`. The
contract is shipped in `@mira/server-core/rpc` and consumed by the
client's `AtomRpc.Service`.

## The two files

### `*.rpc.contract.ts` — types

- One `Rpc.make(name, { payload, success, error })` class per endpoint.
  Endpoint names are PascalCase (`SessionCreate`, `SessionList`).
- One `RpcGroup.make(...)` at the bottom exporting the group.
- Schemas come from `*.schema.ts`; errors from `*.error.ts`. Don't
  re-declare types here.

```ts
export class SessionCreate extends Rpc.make("SessionCreate", {
  payload: Schema.Struct({ userId: Schema.String, expiresAt: Schema.Number }),
  success: Session,
}) {}

export const SessionsRpcs = RpcGroup.make(
  SessionCreate,
  SessionGet,
  SessionList,
  SessionUpdate,
  SessionDelete,
);
```

### `*.rpc.impl.ts` — handlers

- Export one `<Name>Live = <Group>.toLayer(Effect.gen(function*() {...}))`.
- Bind each RPC to a service method. Catch infrastructure errors
  (`ErrorDb`) via `Effect.catchTag` and `Effect.die` — the wire format
  should only surface domain errors.
- Wrap every handler with `Effect.fn("Rpc.<Endpoint>")` so the wire
  boundary shows up as its own span sitting above the service's
  `<Name>Service.<op>` span. Annotate ids on the current span when the
  payload carries them (e.g. `"session.id"`).

Use the **pipe form** of `Effect.catchTags` with an object mapping
tag → handler — it reads linearly top-to-bottom, stays readable as you
add tracing / logging / timeouts, and growing from one caught tag to
several doesn't require swapping combinators. The data-first form
(`Effect.catchTags(subject, { … })`) is banned by
`effect-local/prefer-pipe-catch`, and `Effect.catchTag("Tag", h)` is
banned by `effect-local/prefer-catch-tags`.

```ts
export const SessionsLive = SessionsRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* SessionsService;
    return {
      SessionCreate: Effect.fn("Rpc.SessionCreate")(function* (input) {
        return yield* service.create(input).pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      SessionGet: Effect.fn("Rpc.SessionGet")(function* ({ id }) {
        yield* Effect.annotateCurrentSpan({ "session.id": id });
        return yield* service.get(id).pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      // ...
    };
  }),
);
```

## Do

- Keep RPC names and service method names in sync: `SessionCreate` ↔
  `service.create`.
- Expose every new endpoint through `platform/rpc.contract.ts` by
  merging the group into `ApiGroup`.
- Domain errors (anything a client should handle) go in the `error` arm
  of `Rpc.make`. Infrastructure errors get `Effect.die`'d.
- On the client, use the matching `AtomRpc.Service` wrapper — see the
  `atom` skill.

## Don't

- Don't put business logic in `.rpc.impl.ts`. It's a pure pass-through
  to the service.
- Don't import drizzle / `Db` here. The rpc.impl depends on the service
  contract, which depends on the repo contract.
- Don't throw. `Effect.die` or `Effect.fail` only.

## Where it lives

`src/module/<feature>/<feature>.rpc.contract.ts` and
`<feature>.rpc.impl.ts`.

## Testing

RPCs don't need their own test file — the contract is typed and the
impl is a thin binding. Cover behavior at the service test level (see
the `service-test` skill).

## Lint rules that apply

- Module-wide Effect discipline (`no-throw`, `no-new-date`,
  `no-math-random`, `no-json-parse`) — all **on**.
- `effect-local/prefer-pipe-catch` — `Effect.catchTag` / `catchTags`
  must be used in their data-last (pipe) form.
- `effect-local/prefer-catch-tags` — use `Effect.catchTags({ Tag: h })`,
  not `Effect.catchTag("Tag", h)`, even for a single tag.
