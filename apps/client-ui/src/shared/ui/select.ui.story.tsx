import type { Meta, StoryObj } from "@storybook/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select.ui";

const meta: Meta<typeof Select> = {
  title: "Shared/UI/Select",
  component: Select,
  args: {
    defaultValue: "plan-29",
  },
  decorators: [
    (Story) => (
      <div className="flex min-h-72 items-start bg-background p-6 text-foreground">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: (args) => (
    <Select {...args}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Select plan" />
      </SelectTrigger>
      <SelectContent>
        <SelectLabel>Plans</SelectLabel>
        <SelectItem value="plan-29">29 Apr - 5 refs</SelectItem>
        <SelectItem value="plan-28">28 Apr - 2 refs</SelectItem>
        <SelectSeparator />
        <SelectItem value="plan-empty">Draft plan</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Small: Story = {
  render: () => (
    <Select defaultValue="plan-29">
      <SelectTrigger size="sm" className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="plan-29">29 Apr</SelectItem>
        <SelectItem value="plan-28">28 Apr</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select defaultValue="plan-29" disabled>
      <SelectTrigger className="w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="plan-29">29 Apr - 5 refs</SelectItem>
      </SelectContent>
    </Select>
  ),
};
