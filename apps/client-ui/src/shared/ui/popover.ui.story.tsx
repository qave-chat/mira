import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/shared/ui/button.ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover.ui";

const meta: Meta<typeof Popover> = {
  title: "Shared/UI/Popover",
  component: Popover,
};

export default meta;

type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <div className="flex min-h-48 items-center justify-center">
      <Popover>
        <PopoverTrigger render={<Button variant="outline">Open popover</Button>} />
        <PopoverContent>
          <div className="flex flex-col gap-1 p-2 text-sm">
            <p className="font-medium">Hello</p>
            <p className="text-muted-foreground">This is a popover.</p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
