---
name: module-ui
description: House rules for module-local presentational components (module/<feature>/ui/*.ui.tsx) in apps/client-ui. Use when building feature-scoped views that compose `shared/ui/*` primitives — e.g. `SessionList`, `SessionItem`, `SessionListLoading`, `SessionListError` — rather than generic primitives that belong in `shared/ui/`.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes React 19, class-variance-authority, tailwindcss, and the effect-local oxlint plugin.
metadata:
  scope: apps/client-ui
  prefix: "module/<feature>/ui/*.ui.tsx"
  companion-to: ".ui.story.tsx"
---

# `module/<feature>/ui/*.ui.tsx` — Feature-local views

A module-local `.ui.tsx` is a **pure view scoped to one feature**. It
knows what a `Session` looks like (or a `Billing`, a `Task`, …), but
still knows nothing about atoms, routes, or data fetching. It's the
bridge between generic `shared/ui/` primitives and the feature's route.

## When to use

- A view that is only meaningful in the context of one feature
  (`SessionList`, `SessionItem`, `SessionListLoading`,
  `SessionListError`).
- State-branch views for an `AsyncResult.match`: loading / empty /
  error skeletons that are bespoke to the feature.

If a component could be reused across two unrelated features, promote
it to `shared/ui/` instead — that's where generic primitives live
(`Alert`, `Skeleton`, `Button`).

## Do

- **Pure view, data through props.** Same rule as `shared/ui` — no
  `useState` for logic, no atoms, no RPC, no router.
- **Type props with the RPC contract.** Import domain types from
  `@mira/server-core/rpc` (`Session`, etc.). Don't reach into
  `@mira/server-core/src/...` — the contract is the shared surface.
- **Compose `shared/ui/` primitives.** `Alert` for errors, `Skeleton`
  for loading, `Button` for actions, etc. Don't re-invent primitives
  here.
- **Give every element a `data-slot`.** Match the `shared/ui` convention
  (`data-slot="session-list"`, `data-slot="session-item"`) so tests
  and styles have a stable hook.
- **One component per file.** Co-locate small helper components only
  if they have no other call sites.

## Don't

- Don't import from `@/module/**` _except_ the current feature's own
  `ui/` folder. Cross-feature UI re-use is a signal the component
  should move to `shared/ui/`.
- Don't import atoms, router APIs, or call `fetch` / RPC clients.
  Those live in `*.atom*.ts` and `*.route.tsx`.
- Don't throw. Surface errors through props (see `SessionListError`).
- Don't take the rendered data shape from an atom's `AsyncResult` —
  unwrap it in the route and pass the domain shape in.

## Route integration

Routes own the `AsyncResult.match`; feature UI owns the visuals for
each branch:

```tsx
return AsyncResult.match(session, {
  onInitial: () => <SessionListLoading />,
  onSuccess: (result) => <SessionList sessions={result.value} />,
  onFailure: () => <SessionListError />,
});
```

Each branch is its own `module/<feature>/ui/*.ui.tsx` component, and
each has a story covering its variants.

## Where it lives

`src/module/<feature>/ui/<name>.ui.tsx`. Shared primitives stay in
`src/shared/ui/`.

## Testing

Every module `.ui.tsx` has a companion `<name>.ui.story.tsx` — see
`module.ui.story.skill.md`. Stories are the visual contract; no
`.ui.test.tsx` is required.

## Lint rules that apply

- `effect-local/require-ui-suffix` — files under `**/ui/**` must end
  `.ui.tsx`.
- `effect-local/require-companion-story` — a `<name>.ui.story.tsx`
  sibling must exist.
