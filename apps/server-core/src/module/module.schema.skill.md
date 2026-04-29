---
name: schema
description: House rules for Effect Schema files (*.schema.ts) in apps/server-core. Use when declaring domain types shared across RPC payloads, service signatures, and repo rows — the single source of truth for the shape of a module's data.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes Effect Schema.
metadata:
  scope: apps/server-core
  prefix: ".schema.ts"
---

# `*.schema.ts` — Domain schema

A schema file is the **single source of truth** for a module's domain
types. RPC contracts, service signatures, and repo return types all
refer back to the schemas declared here.

## Canonical shape

```ts
import { Schema } from "effect";

export const Session = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  createdAt: Schema.Number,
  expiresAt: Schema.Number,
});
export type Session = typeof Session.Type;
```

Always export both the runtime schema value **and** the derived type with
the same name — the pattern is `typeof <Name>.Type`.

## Do

- One schema per domain concept. Keep them small and flat.
- Branded primitives (e.g. `Schema.String.pipe(Schema.brand("UserId"))`)
  when a plain string shouldn't be mixable.
- Use `Schema.DateTimeUtcFromNumber` for stored timestamps when you
  want `DateTime` on the domain side.
- Import the schema into `*.rpc.contract.ts` as the `payload` / `success`
  shape so the wire and domain always agree.

## Don't

- Don't declare TypeScript interfaces or type aliases that duplicate a
  schema. The schema is the canonical shape.
- Don't mix schemas and tagged errors in the same file — errors live in
  `*.error.ts`.
- Don't add business logic (`Schema.transform` for display purposes is
  a smell — do that at the service layer).

## Where it lives

`src/module/<feature>/<feature>.schema.ts`. One schema file per module.

## Testing

Schemas don't need their own test file — typescript + `Schema.Type`
cover it. If you add non-trivial `Schema.transform` / `Schema.filter`
logic, cover it in the service test by round-tripping.

## Lint rules that apply

- `effect-local/no-json-parse` — always use `Schema.decodeUnknown` /
  `Schema.encode` instead of `JSON.parse` / `stringify`.
