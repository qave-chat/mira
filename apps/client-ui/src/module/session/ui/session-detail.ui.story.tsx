import type { Meta, StoryObj } from "@storybook/react";

import { SessionDetail } from "@/module/session/ui/session-detail.ui";

const meta: Meta<typeof SessionDetail> = {
  title: "Module/Session/SessionDetail",
  component: SessionDetail,
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-background p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SessionDetail>;

export const Default: Story = {};
