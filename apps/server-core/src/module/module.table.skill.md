---
name: table
description: House rules for Drizzle table files (*.table.ts) in apps/server-core. Use when defining a new Postgres table, adding columns, picking column types, or deciding the mapping between the schema (domain) and the table (persistence).
license: Apache-2.0
compatibility: Designed for Claude Code; assumes drizzle-orm/pg-core and Postgres.
metadata:
  scope: apps/server-core
  prefix: ".table.ts"
---

# `*.table.ts` — Drizzle tables

A table file declares a module's Postgres schema. It's imported by the
repo impl and (for migrations) by `platform/db.impl.ts`. Nothing else
should import it.

## Canonical shape

```ts
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
```

## Do

- Export one `const <table_name> = sqliteTable(...)` per file. The
  variable name mirrors the SQL table name.
- Use `snake_case` for SQL column names (`user_id`) and `camelCase` for
  the JS key (`userId`). Drizzle maps between them.
- `createdAt` and `updatedAt` must always be Postgres timestamps with defaults:
  `timestamp("created_at").notNull().defaultNow()` and
  `timestamp("updated_at").notNull().defaultNow()`.
- The better-auth tables under `src/platform/auth/*.table.ts` are exempt from
  the local lint rule because their schema must continue to match better-auth's
  adapter expectations.
- Domain schemas may still expose timestamps as numbers if that is the wire
  shape; map table `Date` values at the repo/service boundary instead of
  changing the table convention.
- Register the table in `platform/db.impl.ts`'s `drizzle(sqlite, { schema: { ... } })`
  call so it's included in migrations.

## Don't

- Don't import domain schemas (`*.schema.ts`) here. Tables are the
  storage contract, schemas are the domain contract — they agree in
  shape but shouldn't depend on each other.
- Don't re-export the table's inferred types (`$inferSelect`). Services
  talk in `Session` (from the schema), not in table types.
- Don't add indexes / constraints without a corresponding migration
  under `apps/server-core/drizzle/`. Run
  `pnpm --filter @mira/server-core db:generate` to generate.

## Where it lives

`src/module/<feature>/<feature>.table.ts`. One table file per module
for its primary resource; auxiliary join tables stay in the same file
or split into `<feature>-<join>.table.ts`.

## Testing

Tables are covered indirectly by the service test via the in-memory
`Db` layer. If you add a migration, run the service test suite —
migrations run on DB open (`makeDb(":memory:")`).

## Lint rules that apply

- `effect-local/require-table-timestamp-defaults` — `createdAt` and `updatedAt`
  columns in `*.table.ts` must use `timestamp(...).notNull().defaultNow()`.
  Files under `src/platform/auth/` are ignored for better-auth compatibility.
