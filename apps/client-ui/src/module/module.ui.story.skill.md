---
name: module-ui-story
description: House rules for feature-scoped UI stories (module/<feature>/ui/*.ui.story.tsx) in apps/client-ui. Use when writing or editing a Storybook story that sits next to a module/<feature>/ui/*.ui.tsx file — covering the feature's loading / empty / error / populated states, not generic primitives.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes @storybook/react-vite and the effect-local require-companion-story rule.
metadata:
  scope: apps/client-ui
  prefix: "module/<feature>/ui/*.ui.story.tsx"
  companion-to: "module/<feature>/ui/*.ui.tsx"
---

# `module/<feature>/ui/*.ui.story.tsx` — Feature-local stories

Every module-local `.ui.tsx` has a co-located `.ui.story.tsx`. Stories
are the **visual truth** for a feature's views — one story per
meaningful state. The story file is the only place hard-coded example
data lives; the component stays generic.

Uses Storybook's CSF: a default `meta` export plus named `StoryObj`
exports.

## What to cover

For a feature list view, expect stories for every branch the route
can render:

1. **Populated** — a realistic row or two (e.g. `Single`).
2. **Many** — a row count that stresses layout / overflow.
3. **Empty** — the empty-state copy path.
4. **Loading** — if the feature has a `*Loading` component, story the
   default row count plus a `SingleRow` / `ManyRows` variant.
5. **Error** — if the feature has a `*Error` component, story the
   default message and at least one `CustomMessage` variant.

For item-shaped views (`SessionItem`), add edge-case stories:
`LongIds`, `FarFutureExpiry`, etc. — anything that could visually
break.

## Do

- **Hard-code example data in the story file.** Do **not** import from
  `@/module/**` atoms. Use literal objects typed against
  `@mira/server-core/rpc` domain types.
- **Title stories `Session/<ComponentName>`** (or
  `<Feature>/<ComponentName>`). Keep the feature prefix consistent
  across all of a module's stories so Storybook's sidebar groups them.
- **Decorate with the size the UI will actually render in.** Most
  feature views want a `max-w-lg p-4` (or similar) wrapper so the
  layout matches the route context.
- **Reuse a shared sample object** and spread-override per variant so
  the diff between stories is obvious.

## Don't

- Don't call atoms, RPC clients, or router APIs. Stories are
  context-free like the components they showcase.
- Don't mock the RPC layer — stories take props, not atoms. If your
  component needs atoms to render, it doesn't belong in `ui/`.
- Don't assert — that's the route / atom test's job.

## Template

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import type { Session } from "@mira/server-core/rpc";
import { SessionList } from "./session-list.ui";

const base: Session = {
  id: "01JAVT7C7Q2Z4P5T8GDY2C7VYK",
  userId: "user_2nQ5aP8wXmBzLrVc",
  createdAt: Date.UTC(2026, 3, 20, 9, 30, 0),
  expiresAt: Date.UTC(2026, 3, 21, 9, 30, 0),
};

const meta: Meta<typeof SessionList> = {
  title: "Session/SessionList",
  component: SessionList,
  args: { sessions: [base] },
  decorators: [
    (Story) => (
      <div className="max-w-lg p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SessionList>;

export const Single: Story = {};
export const Empty: Story = { args: { sessions: [] } };
```

## Where it lives

Next to the source: `<name>.ui.tsx` + `<name>.ui.story.tsx` in
`module/<feature>/ui/`.

## Lint rules that apply

- `effect-local/require-companion-story` — errors if a `.ui.tsx` has
  no `.ui.story.tsx` sibling.
- Suffix rules skip `.story.` files, so the story itself isn't
  checked for the `.ui.tsx` suffix.
