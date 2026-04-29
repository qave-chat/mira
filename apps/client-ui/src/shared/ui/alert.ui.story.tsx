import type { Meta, StoryObj } from "@storybook/react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert.ui";

const meta: Meta<typeof Alert> = {
  title: "Shared/UI/Alert",
  component: Alert,
  args: { variant: "default" },
  argTypes: {
    variant: {
      options: ["default", "destructive"],
      control: { type: "select" },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>You can style this alert however you want.</AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  args: { variant: "destructive" },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>We couldn't complete your request. Please try again.</AlertDescription>
    </Alert>
  ),
};
