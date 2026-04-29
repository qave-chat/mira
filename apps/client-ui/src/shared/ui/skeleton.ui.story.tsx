import type { Meta, StoryObj } from "@storybook/react";

import { Skeleton } from "@/shared/ui/skeleton.ui";

const meta: Meta<typeof Skeleton> = {
  title: "Shared/UI/Skeleton",
  component: Skeleton,
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  render: () => <Skeleton className="h-4 w-40" />,
};

export const Card: Story = {
  render: () => (
    <div className="w-64 space-y-2">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
};
