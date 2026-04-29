import type { Meta, StoryObj } from "@storybook/react";

import { Logo, LogoWordmark } from "@/shared/ui/logo.ui";

const meta: Meta<typeof Logo> = {
  title: "Shared/UI/Logo",
  component: Logo,
};

export default meta;

type Story = StoryObj<typeof Logo>;

export const Mark: Story = {
  render: () => <Logo />,
};

export const Wordmark: Story = {
  render: () => <LogoWordmark />,
};

export const Large: Story = {
  render: () => <Logo className="h-16 w-auto" />,
};
