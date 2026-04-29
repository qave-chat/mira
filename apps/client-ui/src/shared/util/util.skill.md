---
name: util
description: House rules for pure utility functions (*.util.ts) in apps/client-ui. Use when writing or editing a *.util.ts file — string/number/date formatting, className composition, type guards, predicates, or any pure synchronous function that shouldn't live in a hook, module, or atom.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes effect (DateTime, Random, Schema) and the effect-local oxlint plugin.
metadata:
  scope: apps/client-ui
  prefix: ".util.ts"
---

# `*.util.ts` — Pure utility functions

A `.util.ts` file is a bag of **pure, synchronous, side-effect-free**
functions. That's it. No state, no classes, no singletons, no React, no
effects.

## When to use

- String / number / date formatting (`format-timestamp.util.ts`).
- ClassName composition (`cn.util.ts`).
- Type guards, small predicates, mappings.

## Do

- Export only named functions. A default export is OK if it's a function.
- Prefer Effect primitives: `DateTime` for dates, `Random` (inside
  `Effect.runSync`) for randomness, `Schema` for parsing.
- Keep each function's signature small and provable from the types.

## Don't

- Don't export objects, classes, constants, or React components. The rule
  `util-exports-only-functions` enforces this.
- Don't touch the DOM, network, or filesystem.
- Don't `throw`. Return `Option` / `Result` / a union, or let Effect
  represent failure.
- Don't use `new Date()` — use `DateTime.makeUnsafe` (or `DateTime.make`
  for a validated `Option`) and `DateTime.formatIso`.
- Don't use `Math.random()` —
  `Effect.runSync(Random.nextIntBetween(...))`.
- Don't use `JSON.parse` / `JSON.stringify` — use `Schema.decodeUnknown` /
  `Schema.encode`.

## Where it lives

`src/shared/util/<name>.util.ts`. Feature-local utilities live inside the
feature module, e.g. `module/<feat>/<name>.util.ts`.

## Testing

Co-locate `<name>.util.test.ts`. These are the easiest things in the repo
to test — pure input → output assertions. Aim for full branch coverage on
every function.

## Lint rules that apply

- `effect-local/require-util-suffix` — files under `**/util/**` must end
  `.util.ts`.
- `effect-local/util-exports-only-functions` — every export is a function.
- `effect-local/require-companion-test`.
- `effect-local/util-test-covers-all-exports` — every exported function
  must have a `describe("<name>", ...)` block in the companion test.
- Effect-discipline rules (`no-throw`, `no-new-date`, `no-math-random`,
  `no-json-parse`) are all **on** here.
