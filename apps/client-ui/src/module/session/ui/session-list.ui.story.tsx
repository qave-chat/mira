import type { Meta, StoryObj } from "@storybook/react";

import { SessionList, type SessionListItem } from "@/module/session/ui/session-list.ui";

const sessions: ReadonlyArray<SessionListItem> = [
  {
    id: "ses_381nfd3ypkSBjEKec5uWk2RZsZL",
    name: "Spring launch cutdown",
    plan: "Creator",
  },
  {
    id: "ses_381nfg8RNlsgzmVzPvEe1CQ1oFy",
    name: "Product walkthrough",
    plan: "Studio",
  },
  {
    id: "ses_381nfjY0Hu96QGYzU9UhB9Yu7DP",
    name: "Customer story edit",
    plan: "Pro",
  },
];

const meta: Meta<typeof SessionList> = {
  title: "Module/Session/SessionList",
  component: SessionList,
  args: { sessions, onDelete: () => undefined },
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-background p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SessionList>;

export const Populated: Story = {};

export const Empty: Story = {
  args: { sessions: [] },
};

export const Deleting: Story = {
  args: { deletingSessionId: sessions[0]?.id },
};
