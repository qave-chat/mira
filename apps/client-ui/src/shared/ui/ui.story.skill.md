---
name: ui-story
description: House rules for UI component stories (*.ui.story.tsx) in apps/client-ui. Use when writing or editing a Storybook story that sits next to a *.ui.tsx file — showcasing variants, demonstrating composition, or adding the required companion story when a new shadcn primitive lands.
license: Apache-2.0
compatibility: Designed for Claude Code; assumes @storybook/react-vite and the effect-local oxlint plugin's require-companion-story rule.
metadata:
  scope: apps/client-ui
  prefix: ".ui.story.tsx"
  companion-to: ".ui.tsx"
---

# `*.ui.story.tsx` — Storybook stories

Every `.ui.tsx` has a co-located `.ui.story.tsx`. Stories are the **visual
truth** for presentational components — one story per meaningful visual
state. Tests prove it renders; stories prove it looks right.

Stories use Storybook's **CSF (Component Story Format)**: a default export
`meta` object and named `StoryObj` exports.

## What to cover

1. **Default** — one story per component with minimal props, showing the
   default variant.
2. **Variants** — one story per `class-variance-authority` variant /
   `size`.
3. **Composition** — if the component is built for nesting (`Sidebar`,
   `Sheet`), show it composed with its sibling components.
4. **Edge states** — disabled, loading, empty, very-long-content, if
   they produce visual changes.

Stories are the visual contract for `.ui.tsx` — render every variant /
slot here. No separate `.ui.test.tsx` is required.

## Template

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button.ui";

const meta: Meta<typeof Button> = {
  title: "Shared/Button",
  component: Button,
  args: { children: "Click me", variant: "default", size: "default" },
  argTypes: {
    variant: {
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
      control: { type: "select" },
    },
    size: {
      options: ["default", "xs", "sm", "lg"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button variant="default">Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="xs">xs</Button>
      <Button size="sm">sm</Button>
      <Button size="default">default</Button>
      <Button size="lg">lg</Button>
    </div>
  ),
};
```

## Do

- Export `meta` as the default, typed `Meta<typeof Component>`. Use PascalCase named exports for each `StoryObj`.
- Keep stories declarative. No `useState` for "interactive demos" unless
  the component's interaction is visual (focus, hover).
- For grids of variants, use a `render` that stacks them in a `flex` /
  `grid` wrapper so one story shows the whole spectrum.
- Reuse the component's own types — don't redeclare props.

## Don't

- Don't import from `@/module/**`, atoms, hooks that fetch, or routes.
  Stories are context-free like the components they showcase.
- Don't call RPC clients or mock them — use hard-coded example data.
- Don't assert — that's the test file's job.

## Where it lives

Next to the source: `<name>.ui.tsx` + `<name>.ui.story.tsx` in the same
directory.

## Lint rules that apply

- `effect-local/require-companion-story` — errors if a `.ui.tsx` has no
  `.ui.story.tsx` sibling.
- Suffix rules skip `.story.` files, so the story file itself isn't
  checked for the `.ui.tsx` suffix.
