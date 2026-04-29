import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { CheckIcon } from "lucide-react";
import { cn } from "@/shared/util/cn.util";

const Combobox = ComboboxPrimitive.Root;

function ComboboxInput({
  className,
  ...props
}: React.ComponentProps<typeof ComboboxPrimitive.Input>) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxPositioner({
  className,
  sideOffset = 2,
  align = "start",
  ...props
}: React.ComponentProps<typeof ComboboxPrimitive.Positioner>) {
  return (
    <ComboboxPrimitive.Positioner
      data-slot="combobox-positioner"
      sideOffset={sideOffset}
      align={align}
      className={cn("z-50 outline-none", className)}
      {...props}
    />
  );
}

function ComboboxPopup({
  className,
  ...props
}: React.ComponentProps<typeof ComboboxPrimitive.Popup>) {
  return (
    <ComboboxPrimitive.Popup
      data-slot="combobox-popup"
      className={cn(
        "max-h-60 w-[var(--anchor-width)] overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  ...props
}: React.ComponentProps<typeof ComboboxPrimitive.Item>) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "flex cursor-default items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItemIndicator({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ComboboxPrimitive.ItemIndicator>) {
  return (
    <ComboboxPrimitive.ItemIndicator
      data-slot="combobox-item-indicator"
      className={cn("inline-flex size-4 items-center justify-center", className)}
      {...props}
    >
      {children ?? <CheckIcon className="size-4" />}
    </ComboboxPrimitive.ItemIndicator>
  );
}

function ComboboxEmpty({
  className,
  ...props
}: React.ComponentProps<typeof ComboboxPrimitive.Empty>) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn("px-2 py-1.5 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function ComboboxInputGroup({
  className,
  ...props
}: React.ComponentProps<typeof ComboboxPrimitive.InputGroup>) {
  return (
    <ComboboxPrimitive.InputGroup
      data-slot="combobox-input-group"
      className={cn(
        "flex w-full min-w-0 items-center gap-1.5 rounded-lg border border-input bg-transparent px-2 py-1 text-sm outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30 has-[[data-slot=combobox-chips]]:gap-1 has-[[data-slot=combobox-chips]]:py-0 has-[[data-slot=combobox-chips]]:pr-1",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentProps<typeof ComboboxPrimitive.Chips>) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        "flex min-h-8 flex-1 flex-wrap items-center gap-1 py-1 text-sm outline-none",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChip({
  className,
  ...props
}: React.ComponentProps<typeof ComboboxPrimitive.Chip>) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground outline-none data-[highlighted]:ring-2 data-[highlighted]:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChipRemove({
  className,
  ...props
}: React.ComponentProps<typeof ComboboxPrimitive.ChipRemove>) {
  return (
    <ComboboxPrimitive.ChipRemove
      data-slot="combobox-chip-remove"
      className={cn(
        "inline-flex size-3.5 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChipInput({
  className,
  ...props
}: React.ComponentProps<typeof ComboboxPrimitive.Input>) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn(
        "h-6 min-w-16 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

const ComboboxPortal = ComboboxPrimitive.Portal;
const ComboboxList = ComboboxPrimitive.List;
const ComboboxValue = ComboboxPrimitive.Value;

export {
  Combobox,
  ComboboxInput,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxPopup,
  ComboboxList,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxEmpty,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChipInput,
  ComboboxInputGroup,
  ComboboxValue,
};
