import { XIcon } from "lucide-react";

import { Button } from "@/shared/ui/button.ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog.ui";

export type SessionImagePreviewDialogProps = {
  alt: string;
  isUploading?: boolean;
  onRemove?: () => void;
  src: string;
};

export function SessionImagePreviewDialog({
  alt,
  isUploading = false,
  onRemove,
  src,
}: SessionImagePreviewDialogProps) {
  return (
    <Dialog>
      <div data-slot="session-image-preview" className="relative size-16 shrink-0">
        <DialogTrigger
          render={
            <button
              type="button"
              className="size-16 overflow-hidden rounded-xl border border-border bg-muted/40 shadow-sm outline-none ring-offset-background transition hover:border-foreground/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          }
        >
          <img src={src} alt={alt} className="size-full object-cover" />
          {isUploading ? (
            <span className="absolute inset-0 flex items-end justify-center bg-black/25 pb-1 text-[10px] font-medium text-white">
              Uploading
            </span>
          ) : null}
        </DialogTrigger>
        {onRemove ? (
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label={`Remove ${alt}`}
            className="absolute -top-2 -right-2 size-6 rounded-full shadow-sm"
            onClick={onRemove}
          >
            <XIcon className="size-3.5" />
          </Button>
        ) : null}
      </div>
      <DialogContent
        data-slot="session-image-preview-dialog"
        className="max-h-[90svh] max-w-5xl border-border bg-background/95 p-3"
      >
        <DialogTitle className="sr-only">Image preview</DialogTitle>
        <DialogDescription className="sr-only">
          A larger preview of the selected image.
        </DialogDescription>
        <img src={src} alt={alt} className="max-h-[82svh] w-full rounded-lg object-contain" />
      </DialogContent>
    </Dialog>
  );
}
