import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { SessionCreateDialog } from "@/module/session/ui/session-create-dialog.ui";

const meta: Meta<typeof SessionCreateDialog> = {
  title: "Module/Session/SessionCreateDialog",
  component: SessionCreateDialog,
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-background p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof SessionCreateDialog>;

export const Default: Story = {
  render: () => {
    const [name, setName] = useState("");

    return (
      <SessionCreateDialog
        name={name}
        onNameChange={setName}
        onSubmit={(event) => event.preventDefault()}
      />
    );
  },
};
