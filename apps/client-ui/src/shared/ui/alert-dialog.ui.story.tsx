import type { Meta, StoryObj } from "@storybook/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog.ui";
import { Button } from "@/shared/ui/button.ui";

const meta: Meta<typeof AlertDialog> = {
  title: "Shared/UI/AlertDialog",
  component: AlertDialog,
};

export default meta;

type Story = StoryObj<typeof AlertDialog>;

export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline">Remove session</Button>} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove this session?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The session and its history will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive">Remove</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};
