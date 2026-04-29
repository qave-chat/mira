import type { FormEvent } from "react";
import { Button } from "@/shared/ui/button.ui";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog.ui";
import { Input } from "@/shared/ui/input.ui";

export type SessionCreateDialogProps = {
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function SessionCreateDialog({ name, onNameChange, onSubmit }: SessionCreateDialogProps) {
  return (
    <Dialog>
      <DialogTrigger render={<Button>New session</Button>} />
      <DialogContent data-slot="session-create-dialog">
        <form onSubmit={onSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Create session</DialogTitle>
            <DialogDescription>
              Name the session. Plan selection will be added later.
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-2 text-sm font-medium">
            Session name
            <Input
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="e.g. Launch teaser"
            />
          </label>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <DialogClose render={<Button type="submit" />}>Create session</DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
