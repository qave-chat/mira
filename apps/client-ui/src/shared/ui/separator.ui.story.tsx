import type { Meta, StoryObj } from "@storybook/react";

import { Separator } from "@/shared/ui/separator.ui";

const meta: Meta<typeof Separator> = {
  title: "Shared/UI/Separator",
  component: Separator,
};

export default meta;

type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-64 space-y-2">
      <div>Above</div>
      <Separator />
      <div>Below</div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-12 items-center gap-2">
      <span>Left</span>
      <Separator orientation="vertical" />
      <span>Right</span>
    </div>
  ),
};
