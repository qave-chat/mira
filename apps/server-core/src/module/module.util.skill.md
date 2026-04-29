---
name: util
description: House rules for pure utility functions (*.util.ts) in apps/server-core. Use when extracting deterministic business helpers from services, repos, or RPC handlers.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes effect@beta and the effect-local oxlint plugin.
metadata:
  scope: apps/server-core
  prefix: ".util.ts"
---

# `*.util.ts` — Pure Utilities

A `.util.ts` file contains only pure, synchronous, deterministic functions.
No services, layers, effects, IO, mutation of external state, classes, or
exported constants.

## Do

- Export only named functions.
- Use a single object parameter for every exported function.
- Keep functions deterministic: same input object, same output.
- Co-locate `<feature>.util.test.ts` next to `<feature>.util.ts`.
- Cover every exported function with a `describe("<name>", ...)` block.

## Don't

- Don't import repos, services, layers, platform modules, or RPC handlers.
- Don't export objects, constants, classes, schemas, or default exports.
- Don't use `Effect`, `Clock`, `Random`, timers, filesystem, network, or database APIs.
- Don't throw. Return explicit values and let callers decide how to model failure.
- Don't use positional parameters. Prefer `{ input }` even for one field.

## Where It Lives

`src/module/<feature>/<feature>.util.ts`.

## Lint Rules That Apply

- `effect-local/util-exports-only-functions` — every export is a function.
- `effect-local/util-export-object-params` — every exported function has exactly one object parameter.
- `effect-local/require-companion-test`.
- `effect-local/util-test-covers-all-exports` — every exported function must have a matching `describe("<name>", ...)` block.
- Effect-discipline rules (`no-throw`, `no-new-date`, `no-math-random`, `no-json-parse`) are all on.
