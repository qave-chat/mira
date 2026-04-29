import type { Meta, StoryObj } from "@storybook/react";

import { SessionList, type SessionListItem } from "@/module/session/ui/session-list.ui";

const sessions: ReadonlyArray<SessionListItem> = [
  {
    id: "session-1042",
    name: "Spring launch cutdown",
    plan: "Creator",
  },
  {
    id: "session-1041",
    name: "Product walkthrough",
    plan: "Studio",
  },
  {
    id: "session-1040",
    name: "Customer story edit",
    plan: "Pro",
  },
];

const meta: Meta<typeof SessionList> = {
  title: "Module/Session/SessionList",
  component: SessionList,
  args: { sessions },
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
