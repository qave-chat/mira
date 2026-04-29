---
name: ui
description: House rules for presentational React components (*.ui.tsx) in apps/client-ui. Use when writing, editing, or reviewing a *.ui.tsx file, composing shadcn primitives, adding visual variants with class-variance-authority, or deciding whether a component belongs under shared/ui or inside a module.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes React 19, @base-ui/react, class-variance-authority, tailwindcss, and the effect-local oxlint plugin.
metadata:
  scope: apps/client-ui
  prefix: ".ui.tsx"
---

# `.ui.tsx` — Presentational components

A `.ui.tsx` file is a **pure view**. No state, no effects, no data fetching,
no business rules. If you need any of those, this is not the right file.

## When to use

- A shadcn primitive (`button.ui.tsx`, `input.ui.tsx`).
- A small composition of primitives that only reads props
  (`module-layout.ui.tsx`).
- Anything you could screenshot and would render identically in every
  context.

## Do

- Accept data through props. Nothing else.
- Compose `class-variance-authority` + `cn` for variants. Keep variants here.
- Import from other `.ui.{ts,tsx}` files in `src/shared/ui/`.
- Keep the default export shape (named exports) consistent with shadcn.

## Don't

- Don't call `useState`, `useEffect`, `useMemo` _for logic_ — a purely-visual
  memo is fine, but if the memo reads a store or fires side effects, it
  belongs elsewhere.
- Don't import from `@/module/**` — UI should be context-free.
- Don't call `fetch`, RPC clients, atoms, router APIs.
- Don't `throw`. (`no-throw` is off here only because shadcn primitives do,
  not as an invitation to add more.)

## Where it lives

`src/shared/ui/<name>.ui.tsx` for shared primitives. Composites that are
only used by a single module may sit inside that module
(`module/<x>/<x>.ui.tsx`).

## Testing

Verify rendering in the companion `<name>.ui.story.tsx` (Ladle). No
`.ui.test.tsx` is required — stories cover the visual/prop surface.

## Lint rules that apply

- `effect-local/require-ui-suffix` — files under `**/ui/**` must end
  `.ui.tsx`.
- `effect-local/require-companion-story` — a `<name>.ui.story.tsx` sibling
  must exist.

## Add a shadcn component

Never call `shadcn add` directly — the wrapper renames generated files to
`.ui.tsx` and rewrites cross-component imports:

```sh
pnpm --filter @mira/client-ui ui:add <component>
```
