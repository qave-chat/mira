import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "./scroll-area.ui";

const meta: Meta<typeof ScrollArea> = {
  title: "Shared/UI/ScrollArea",
  component: ScrollArea,
  decorators: [
    (Story) => (
      <div className="h-64 w-64 rounded border">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof ScrollArea>;

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-full w-full">
      <div className="p-4">
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i} className="text-sm leading-6">
            Line {i + 1}
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};
