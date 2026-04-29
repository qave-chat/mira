import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/shared/ui/button.ui";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip.ui";

type Side = "top" | "right" | "bottom" | "left";

const meta: Meta<{ side: Side }> = {
  title: "Shared/UI/Tooltip",
  args: { side: "top" },
  argTypes: {
    side: {
      options: ["top", "right", "bottom", "left"],
      control: { type: "select" },
    },
  },
  render: ({ side }) => (
    <TooltipProvider>
      <div className="flex justify-center p-16">
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline">Hover me</Button>} />
          <TooltipContent side={side}>Tooltip content</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};

export default meta;

type Story = StoryObj<{ side: Side }>;

export const Default: Story = {};
