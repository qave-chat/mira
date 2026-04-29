import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/shared/ui/button.ui";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet.ui";

type Side = "top" | "right" | "bottom" | "left";

const meta: Meta<{ side: Side }> = {
  title: "Shared/UI/Sheet",
  args: { side: "right" },
  argTypes: {
    side: {
      options: ["top", "right", "bottom", "left"],
      control: { type: "select" },
    },
  },
  render: ({ side }) => (
    <Sheet>
      <SheetTrigger render={<Button>Open sheet</Button>} />
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Sheet title</SheetTitle>
          <SheetDescription>A short description goes here.</SheetDescription>
        </SheetHeader>
        <div className="p-4 text-sm text-muted-foreground">Body content</div>
      </SheetContent>
    </Sheet>
  ),
};

export default meta;

type Story = StoryObj<{ side: Side }>;

export const Default: Story = {};
