---
name: service
description: House rules for service files (*.service.ts) in apps/server-core. Use when adding a domain service method, wiring Context.Service + Layer.effect, annotating spans/logs, or deciding which layer a concern belongs in (service vs repo vs rpc).
license: Apache-2.0
compatibility: Designed for Claude Code; assumes effect@beta (Context, Effect, Layer) and the effect-local oxlint plugin.
metadata:
  scope: apps/server-core
  prefix: ".service.ts"
---

# `*.service.ts` — Domain service

A service is the **domain** layer: it owns the business rules that turn
an RPC payload into a persistence call. It sits between the RPC handler
(transport) and the repo (persistence).

## The file

One file per service. No contract/impl split — `Context.Service` with the
`make` option infers the shape from the constructor effect, so the tag
and the implementation live together.

```ts
// sessions.service.ts
import { Context, Effect, Layer, Schema } from "effect";
import { SessionsRepo } from "./sessions.repo";

const withModuleLogs = Effect.annotateLogs({ module: "sessions" });

export class ErrorSessionNotFound extends Schema.TaggedErrorClass<ErrorSessionNotFound>()(
  "ErrorSessionNotFound",
  { id: Schema.String },
) {}

export class SessionsService extends Context.Service<SessionsService>()("module/SessionsService", {
  make: Effect.gen(function* () {
    const repo = yield* SessionsRepo;

    const create = Effect.fn("SessionsService.create")(function* (input: { /* ... */ }) {
      // ...
    }, withModuleLogs);

    // ...

    return { create /* ... */ } as const;
  }),
}) {}

export const SessionsServiceLive = Layer.effect(SessionsService, SessionsService.make);
```

## Conventions

- Service id: `module/<Name>Service`. Stick to this shape for consistent
  tracing / log correlation.
- Each method wrapped in `Effect.fn("<Name>Service.<method>")(function*() {...}, withModuleLogs)`.
- `withModuleLogs = Effect.annotateLogs({ module: "<feature>" })` — defined
  once at the top of the file, reused per method.
- Annotate spans with `Effect.annotateCurrentSpan({ "<feature>.id": ... })`
  at the start of each method.
- Log significant state changes with `Effect.logInfo("<feature>.<verb>")`
  (e.g. `"session.created"`, `"session.deleted"`).
- Domain errors (`Error<Entity><Reason>` via `Schema.TaggedErrorClass`)
  are exported from this same file — co-located with the service. The
  `effect-local/tagged-error-name` lint enforces the `Error*` prefix and
  the class-name/tag equality.
- Errors in method signatures are **inferred from `Effect.gen`** — no
  need to hand-write `Effect<A, ErrorDb | ErrorSessionNotFound>`. Lean
  into the inference.
- End the file with `export const <Name>ServiceLive = Layer.effect(<Name>Service, <Name>Service.make);`.
  Other modules, tests, and `main.ts` import the `Live` layer by name.

## Do

- One service method per RPC endpoint, 1:1 naming (`service.create` ↔
  `SessionCreate`).
- One tagged-error class per distinct failure case (`ErrorSessionNotFound`,
  `ErrorSessionExpired`, `ErrorSessionLocked`, …). Surface them with
  `return yield* new ErrorSessionNotFound({ id })` and attach them to the
  matching `Rpc.make` as the `error` arm so the client sees them typed.
- Pull the repo once at the top of `make` (`const repo = yield* SessionsRepo`)
  and reuse it across methods.

## Don't

- Don't throw — always `yield* new <Error>(...)` or `Effect.fail`.
- Don't use generic errors (`Error`, `TypeError`) — the client can't
  discriminate them. Always tagged errors.
- Don't put infrastructure errors (`ErrorDb`, network) in domain error
  classes. Those live in `platform/*.contract.ts` and get `Effect.die`'d
  at the RPC boundary so the wire format stays clean.
- Don't include fields the client can't use in an error payload. Stack
  traces, internal ids, cause chains — log them, don't serialize them.
- Don't call drizzle directly — go through the repo.
- Don't import another module's internals — import the public module
  surface (the service class and `Live` layer from `./<feature>.service`).
- Don't re-introduce a `.contract.ts` / `.impl.ts` split. The service's
  public surface is the exported class + `Live` layer; the shape is
  inferred from the `make` effect. The split is reserved for HTTP/RPC,
  platform ports (`Db`, `Ec2`, `Auth`), or cases with multiple impls.

## Where it lives

`src/module/<feature>/<feature>.service.ts`.

## Testing

Every service has a `<feature>.service.test.ts` — see the
`service-test` skill for the canonical shape.

## Lint rules that apply

- Module-wide Effect discipline (`no-throw`, `no-new-date`,
  `no-math-random`, `no-json-parse`) — all **on**.
- `effect-local/require-companion-test` — every `*.service.ts` must
  have a `*.service.test.ts` sibling.
- `effect-local/tagged-error-name` — every `Schema.TaggedErrorClass`
  class must be named `Error<Entity><Reason>` and the tag string must
  equal the class name.
