import type { Meta, StoryObj } from "@storybook/react";

import { Input } from "@/shared/ui/input.ui";

const meta: Meta<typeof Input> = {
  title: "Shared/UI/Input",
  component: Input,
  args: { placeholder: "Type something…", disabled: false },
  argTypes: {
    placeholder: { control: { type: "text" } },
    disabled: { control: { type: "boolean" } },
  },
  render: (args) => (
    <div className="w-64">
      <Input {...args} />
    </div>
  ),
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const Invalid: Story = {
  render: () => (
    <div className="w-64">
      <Input aria-invalid defaultValue="bad value" />
    </div>
  ),
};
