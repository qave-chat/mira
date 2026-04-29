---
name: route
description: House rules for TanStack Router route files (*.route.tsx) in apps/client-ui. Use when adding a new URL, wiring beforeLoad or redirect, writing the root layout in app.route.tsx, registering a route in src/routes.ts, or testing route behavior.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes @tanstack/react-router, @tanstack/virtual-file-routes, and the effect-local oxlint plugin.
metadata:
  scope: apps/client-ui
  prefix: ".route.tsx"
---

# `*.route.tsx` — TanStack Router routes

A `.route.tsx` file owns a **single URL** and is the **orchestration
seam** between data and view. It reads from atoms / hooks, derives the
props each UI component needs, and composes `.ui.tsx` children. Nothing
else goes here.

Think of a route as: _"given this URL, pick the data, shape it, and hand
it to dumb UI."_ If a line of JSX isn't doing one of those three things,
it belongs elsewhere.

## Responsibilities

A route file is responsible for — and only for:

1. **URL wiring.** Export a `Route` built with `createFileRoute` /
   `createRootRoute`. Declare `beforeLoad`, `loader`, `validateSearch`,
   `redirect`.
2. **Data fetching / subscription.** Read atoms via `useAtomValue`,
   call hooks, resolve `AsyncResult`s. This is the _only_ place a route
   touches a data source.
3. **Prop shaping.** Map raw atom values into the props shape each
   `.ui.tsx` child expects. Keep mapping trivial (`items.map(...)`,
   destructuring, branch on `AsyncResult.match`) — if it grows, push
   into a `.util.ts` or an atom derivation.
4. **Composition.** Render `.ui.tsx` components with the shaped props.
   Layout-level JSX (flex wrappers, section headings) is fine; anything
   reusable becomes a `.ui.tsx`.

## When to use

- Any file referenced from `src/routes.ts` (virtual file routes). Routes
  live inside the module that owns them
  (`module/<feat>/<feat>.route.tsx`), except the root layout at
  `src/app.route.tsx`.

## Do

- Export a `Route` built with `createFileRoute` or `createRootRoute`.
- Use `throw redirect({ to: "..." })` in `beforeLoad` — this is the
  framework API. `no-throw` stays **on** in routes; mark the specific
  site with:

  ```ts
  // oxlint-disable-next-line effect-local/no-throw -- TanStack Router: redirect is raised via throw
  throw redirect({ to: "/session" });
  ```

- Pull data through atoms (`*.atom.ts`) / hooks, not inline `fetch`.
- Keep JSX thin — compose `.ui.tsx` children and pass props down.
- Resolve `AsyncResult` / loading states at the route level. UI
  components should receive already-narrowed data whenever practical.

## Don't

- Don't write business logic inline. Move it to a module service, atom,
  or `.util.ts`.
- Don't style individual list items, buttons, or cards inline. That
  belongs in a `.ui.tsx`.
- Don't use `new Date()` — use `DateTime` + a `.util.ts` (see
  `format-timestamp.util.ts`). `no-new-date` is **on** in routes.
- Don't export helpers — route files export only the `Route` value.
- Don't import another `*.route.tsx`. Routes are leaves of the module
  graph.

## Where it lives

- Root layout: `src/app.route.tsx`.
- Module routes: `src/module/<feature>/<feature>.route.tsx`.
- Register every route in `src/routes.ts`.

## Testing

Route files are **exempt** from `require-companion-test`. They're thin
orchestration layers — logic worth testing already lives in atoms,
hooks, utils, and UI components (which each have their own tests /
stories). If a route grows complex enough to warrant a test, that's a
signal to extract the logic, not to test the route.

## Lint rules that apply

- `effect-local/no-throw` — **on**. Disable inline only at TanStack
  `throw redirect(...)` sites.
- `effect-local/no-new-date` — **on**.
- `effect-local/require-companion-test` — **off** for `*.route.tsx`.
