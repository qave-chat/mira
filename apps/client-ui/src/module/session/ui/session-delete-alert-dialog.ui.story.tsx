import type { Meta, StoryObj } from "@storybook/react";

import { SessionDeleteAlertDialog } from "@/module/session/ui/session-delete-alert-dialog.ui";

const session = {
  id: "ses_381nfd3ypkSBjEKec5uWk2RZsZL",
  name: "Spring launch cutdown",
};

const meta: Meta<typeof SessionDeleteAlertDialog> = {
  title: "Module/Session/SessionDeleteAlertDialog",
  component: SessionDeleteAlertDialog,
  args: {
    session,
    onConfirm: () => undefined,
  },
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-background p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SessionDeleteAlertDialog>;

export const Default: Story = {};

export const Deleting: Story = {
  args: { defaultOpen: true, isDeleting: true },
};
