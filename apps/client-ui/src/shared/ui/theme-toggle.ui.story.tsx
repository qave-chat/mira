import type { Meta, StoryObj } from "@storybook/react";

import { ThemeToggle } from "@/shared/ui/theme-toggle.ui";

const meta: Meta<typeof ThemeToggle> = {
  title: "Shared/UI/ThemeToggle",
  component: ThemeToggle,
  args: {
    resolvedTheme: "light",
    onToggle: () => {},
  },
  argTypes: {
    resolvedTheme: {
      options: ["light", "dark"],
      control: { type: "select" },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ThemeToggle>;

export const Light: Story = {};

export const Dark: Story = {
  args: {
    resolvedTheme: "dark",
  },
};

export const Both: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <ThemeToggle resolvedTheme="light" onToggle={() => {}} />
      <ThemeToggle resolvedTheme="dark" onToggle={() => {}} />
    </div>
  ),
};
