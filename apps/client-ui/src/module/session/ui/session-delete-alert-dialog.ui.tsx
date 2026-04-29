import { Button } from "@/shared/ui/button.ui";
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

export type SessionDeleteAlertDialogSession = {
  id: string;
  name: string;
};

export type SessionDeleteAlertDialogProps = {
  session: SessionDeleteAlertDialogSession;
  defaultOpen?: boolean;
  isDeleting?: boolean;
  disabled?: boolean;
  onConfirm: (session: SessionDeleteAlertDialogSession) => void;
};

export function SessionDeleteAlertDialog({
  session,
  defaultOpen,
  isDeleting,
  disabled,
  onConfirm,
}: SessionDeleteAlertDialogProps) {
  return (
    <AlertDialog defaultOpen={defaultOpen}>
      <AlertDialogTrigger
        render={
          <Button type="button" variant="destructive" size="sm" disabled={disabled || isDeleting} />
        }
      >
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent data-slot="session-delete-alert-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {session.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This also removes the session plans and schedules uploaded files for deletion. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={() => onConfirm(session)}
          >
            {isDeleting ? (
              <>
                <span className="size-3 animate-spin rounded-full border border-current border-t-transparent" />
                Deleting...
              </>
            ) : (
              "Delete session"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
