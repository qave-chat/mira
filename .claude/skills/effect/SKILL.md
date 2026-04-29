---
name: effect
description: "Use this skill whenever you read, write, edit, or review Effect-TS code in this repo (imports from `effect`, `@effect/*`, files using `Effect.gen`, `Effect.fn`, `Context.Service`, `Layer`, `Schema`, `Stream`, `HttpApi`, `ManagedRuntime`, etc.). It loads the canonical Effect library docs, example patterns, and house style rules for this codebase."
allowed-tools: ["Read", "Glob", "Grep"]
---

# Effect-TS skill

This skill makes sure every Effect change in this repo is written against the
**current** Effect API surface (beta) and the patterns Kevin prefers, instead
of outdated docs from training data or `node_modules`.

## When to activate

Activate automatically (no need to ask) when any of the following is true:

- You are about to write, edit, or review TypeScript that imports from
  `effect`, `@effect/*`, or `effect/unstable/*`.
- The user asks you to build a service, layer, schema, HTTP API, stream,
  CLI, child-process wrapper, AI tool, or cluster entity.
- You see `Effect.gen`, `Effect.fn`, `Effect.fnUntraced`, `Layer.*`,
  `Context.Service`, `Schema.TaggedErrorClass`, `ManagedRuntime`,
  `NodeRuntime.runMain`, `BunRuntime.runMain`, or similar symbols in the
  current file or diff.
- The user references Effect by name ("write this in Effect", "add an
  Effect service", "convert this to Effect", "make an Effect-based test").

If in doubt — the file imports from `effect` — activate.

## What to load (and in what order)

All paths are relative to the **repo root** (`/Users/kevin_sucasa/Code/knd/mira`).

1. **Always start here**: `docs/effect/LLMS.md`
   - Top-level index with inline code and links into `docs/effect/ai-docs/src/**`.
   - Skim the whole file; it is only ~14KB.

2. **For the specific topic**, open the matching example(s) under
   `docs/effect/ai-docs/src/`. Topics:

   | Topic                                    | Folder                    |
   | ---------------------------------------- | ------------------------- |
   | `Effect.gen` / `Effect.fn` / creating    | `01_effect/01_basics/`    |
   | Services / Layers / Layer composition    | `01_effect/02_services/`  |
   | Errors & tagged errors                   | `01_effect/03_errors/`    |
   | Resources / Scopes / LayerMap            | `01_effect/04_resources/` |
   | Running programs (Node/Bun runtime)      | `01_effect/05_running/`   |
   | PubSub                                   | `01_effect/06_pubsub/`    |
   | Streams                                  | `02_stream/`              |
   | `ManagedRuntime` + non-Effect frameworks | `03_integration/`         |
   | Batching with `RequestResolver`          | `05_batching/`            |
   | Schedules (retry / repeat / poll)        | `06_schedule/`            |
   | Logging, tracing, Otlp                   | `08_observability/`       |
   | Testing with `@effect/vitest`            | `09_testing/`             |
   | `HttpClient`                             | `50_http-client/`         |
   | `HttpApi` (schema-first server)          | `51_http-server/`         |
   | Child processes                          | `60_child-process/`       |
   | Effect CLI module                        | `70_cli/`                 |
   | AI / LanguageModel / tools / chat        | `71_ai/`                  |
   | Cluster entities                         | `80_cluster/`             |

3. **Reference** (read when you need context on upstream style, not house rules):
   `docs/effect/AGENTS.md` — the AGENTS.md from the `effect-smol` repo.
   Note: that file is written for contributors to the Effect library itself, so
   commands like `pnpm lint-fix`, `pnpm codegen`, `.changeset/`, `.patterns/`,
   and `packages/*/test/` **do not apply here**. Treat it as style guidance
   only — the rules under "Code Style Guidelines" and below are useful.

## House rules for this repo

These apply on top of the upstream docs. When LLMS.md and these rules
conflict, these rules win (they reflect this repo's stack and preferences).

### Writing Effect code

- **Prefer `Effect.gen(function*() { ... })` for top-level flows and
  `Effect.fn("name")(function*(...) { ... })` for functions that return
  an `Effect`.** Attach combinators via `.pipe(...)` on the `Effect.gen`
  result; **do not** `.pipe` the `Effect.fn` result — pass extra
  combinators as trailing arguments to `Effect.fn` itself.
- The string you pass to `Effect.fn("...")` should match the function
  name — it becomes the span name and improves stack traces.
- **Never** use `async` / `await` or `try` / `catch`. Use `Effect.tryPromise`,
  `Effect.try`, `Effect.catch`, `Effect.catchTag`, `Effect.catchTags`.
- **Never** use `Date.now()` or `new Date()`. Use the `Clock` module
  (and `TestClock` in tests).
- Always `return yield* someError` when raising in a generator, so
  TypeScript narrows the remainder of the block as unreachable.

### Services, Layers, Errors

- Define services with `class Foo extends Context.Service<Foo, { ... }>()("pkg/path/Foo") { ... }`.
  Put a static `layer = Layer.effect(Foo, Effect.gen(function*() { ... Foo.of({...}) }))` on the class.
- Use `Schema.TaggedErrorClass` for domain errors (not plain `class extends Error`).
- Compose layers with `Layer.provide` / `Layer.provideMerge` / `Layer.mergeAll`.
  Reach for `Layer.unwrapEffect` / `Layer.unwrapScoped` when a layer depends on
  a `Config` or an `Effect`.

### Running

- Bun-based apps (e.g. `apps/server-core`, which uses `@effect/platform-bun`
  and `effect@beta`): use `BunRuntime.runMain(program.pipe(Effect.provide(AppLayer)))`.
- Node-based apps: use `NodeRuntime.runMain`.
- For long-running processes built entirely from layers, prefer
  `Layer.launch(AppLayer).pipe(BunRuntime.runMain)` over building a dummy program.
- When embedding Effect inside non-Effect frameworks (React, a non-Effect
  server, etc.), build one `ManagedRuntime.make(AppLayer)` and reuse it.

### Testing

- Use `@effect/vitest` — it is already installed in `apps/server-core`.
- Import `{ assert, describe, it, expect, layer }` from `@effect/vitest`.
- Write tests as `it.effect("name", () => Effect.gen(function*() { ... }))`.
- Use `assert.*` for assertions in Effect tests; don't mix `expect` into them.
- Share layers across tests in a file with `describe.concurrent` + `layer(MyLayer)(...)`
  (see `docs/effect/ai-docs/src/09_testing/20_layer-tests.ts`).

### HTTP

- For servers, prefer the schema-first `HttpApi` approach
  (`docs/effect/ai-docs/src/51_http-server/`) — one definition gives you
  typed handlers, runtime validation, a typed client, and OpenAPI.
- For outbound calls, use `HttpClient` + `HttpClientRequest` + schema-decoded
  responses (`docs/effect/ai-docs/src/50_http-client/10_basics.ts`).

### Things NOT to import from the upstream AGENTS.md

The upstream file was written for the Effect library itself. Ignore these when
working in **this** repo:

- `pnpm lint-fix`, `pnpm check:tsgo`, `pnpm docgen`, `pnpm codegen` — this repo
  uses `oxlint`, `oxfmt`, and `tsgo --noEmit` via `pnpm typecheck` (see root
  `package.json`).
- `.patterns/`, `.changeset/`, `packages/*/test/`, `scratchpad/` — none of
  those exist here.
- "barrel files are auto-generated" — not true in this repo; write them by hand
  if you need them.

## How to use this skill in practice

1. Before writing any Effect code, open `docs/effect/LLMS.md` and read the
   section(s) matching the task.
2. Open the specific example file(s) from the table above. **Read the actual
   file** — do not rely on summaries. The examples have inline comments that
   explain _why_ each line is there.
3. Apply the house rules above on top of whatever LLMS.md says.
4. When you invent a new pattern (e.g. a new service), grep this repo first
   (`apps/server-core/src`, `apps/client-cli/src`, `apps/client-ui/src`,
   `tools/`) to see if a similar one already exists, and match that style.
5. After editing, run `pnpm typecheck` at the repo root (and `pnpm lint` if
   the change is non-trivial) before declaring done.
