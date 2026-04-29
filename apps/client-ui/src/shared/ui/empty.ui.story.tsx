import type { Meta, StoryObj } from "@storybook/react";
import { Inbox, Search } from "lucide-react";
import { Button } from "./button.ui";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty.ui";

type Args = {
  title: string;
  description: string;
  withAction?: boolean;
  withIcon?: boolean;
};

function EmptyDemo({ title, description, withAction = false, withIcon = true }: Args) {
  return (
    <Empty className="border">
      <EmptyHeader>
        {withIcon ? (
          <EmptyMedia variant="icon">
            <Inbox />
          </EmptyMedia>
        ) : null}
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {withAction ? (
        <EmptyContent>
          <Button>Create one</Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}

const meta: Meta<typeof EmptyDemo> = {
  title: "Shared/UI/Empty",
  component: EmptyDemo,
  args: {
    title: "No items",
    description: "Nothing to show here yet.",
    withAction: false,
    withIcon: true,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof EmptyDemo>;

export const Default: Story = {};

export const WithAction: Story = {
  args: { withAction: true },
};

export const NoMatches: Story = {
  args: {
    title: "No matches",
    description: "Try a different search term.",
  },
  render: (args) => (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Search />
        </EmptyMedia>
        <EmptyTitle>{args.title}</EmptyTitle>
        <EmptyDescription>{args.description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
};

export const WithoutIcon: Story = {
  args: { withIcon: false },
};
