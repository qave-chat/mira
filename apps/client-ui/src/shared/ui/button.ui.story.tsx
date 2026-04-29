import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/shared/ui/button.ui";

const meta: Meta<typeof Button> = {
  title: "Shared/UI/Button",
  component: Button,
  args: {
    children: "Click me",
    variant: "default",
    size: "default",
    disabled: false,
  },
  argTypes: {
    variant: {
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
      control: { type: "select" },
    },
    size: {
      options: ["default", "xs", "sm", "lg"],
      control: { type: "select" },
    },
    disabled: { control: { type: "boolean" } },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="default">Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="xs">xs</Button>
      <Button size="sm">sm</Button>
      <Button size="default">default</Button>
      <Button size="lg">lg</Button>
    </div>
  ),
};
