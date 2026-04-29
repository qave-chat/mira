---
name: hook
description: House rules for React hook files (*.hook.ts) in apps/client-ui. Use when writing or editing a use-*.hook.ts file, wrapping React APIs behind a domain-specific name, adapting a store or Effect atom into a React-consumable value, or deciding whether a value belongs in a hook vs a util.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes React 19, Effect atoms (effect/unstable/reactivity), and the effect-local oxlint plugin.
metadata:
  scope: apps/client-ui
  prefix: ".hook.ts"
---

# `*.hook.ts` — React hooks

A `.hook.ts` file holds one or more React hooks. Every export **must** start
with `use`. If a value isn't a hook, it doesn't live here.

## When to use

- Wrapping React APIs (`useSyncExternalStore`, `useEffect`) behind a
  domain-specific name.
- Adapting a store / atom / external source into a React-consumable hook.
- Feature-specific hooks that are always used from the view layer.

## Do

- File name: `use-<name>.hook.ts(x)`. The prefix `use-` is enforced.
- All exports start with `use`. No helper exports — inline them or move
  them to a `.util.ts`.
- Keep hooks small. One file, one concept.

## Don't

- Don't export registries, singletons, config objects, or classes. They're
  not hooks. Move them to a module or atom file.
- Don't mutate global state outside the hook's closure.
- Don't throw from a hook unless it's a React invariant (e.g. "must be
  used inside a Provider"). Prefer returning a `Result` / error state.

## Where it lives

`src/shared/hook/<use-name>.hook.ts` for app-wide hooks. Feature-local
hooks belong in `src/module/<name>/<use-name>.hook.ts`.

## Testing

Co-locate `<use-name>.hook.test.ts`. Use `@testing-library/react`'s
`renderHook` to drive the hook under different stores / props and assert
the returned value + subscription behavior.

## Lint rules that apply

- `effect-local/require-hook-suffix` — filename must be
  `use-<name>.hook.ts(x)`.
- `effect-local/hook-exports-use-prefix` — every export starts with `use`.
- `effect-local/require-companion-test`.
