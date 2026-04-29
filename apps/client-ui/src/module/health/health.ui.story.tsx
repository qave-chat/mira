import type { Meta, StoryObj } from "@storybook/react";

import { HealthDot } from "@/module/health/health.ui";

const meta: Meta<typeof HealthDot> = {
  title: "Module/Health/HealthDot",
  component: HealthDot,
};

export default meta;

type Story = StoryObj<typeof HealthDot>;

export const Default: Story = {
  render: () => (
    <div className="flex gap-2">
      <HealthDot status="ok" />
      <HealthDot status="down" />
      <HealthDot status="loading" />
    </div>
  ),
};
