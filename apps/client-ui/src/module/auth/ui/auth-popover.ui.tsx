import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover.ui";
import { SidebarMenuButton } from "@/shared/ui/sidebar.ui";
import { cn } from "@/shared/util/cn.util";

export type AuthUser = {
  name: string;
  email: string;
  image?: string | null;
};

export type AuthPopoverProps = {
  user: AuthUser;
  onLogout: () => void;
  className?: string;
};

export function AuthPopover({ user, onLogout, className }: AuthPopoverProps) {
  const initials = getInitials(user.name || user.email);
  return (
    <Popover>
      <PopoverTrigger
        render={
          <SidebarMenuButton
            size="lg"
            className={cn(
              "data-[popup-open]:bg-sidebar-accent data-[popup-open]:text-sidebar-accent-foreground",
              className,
            )}
          >
            <Avatar image={user.image} initials={initials} />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4" />
          </SidebarMenuButton>
        }
      />
      <PopoverContent
        className="w-[var(--anchor-width)] min-w-56 p-1"
        align="end"
        side="top"
        sideOffset={4}
      >
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm">
          <Avatar image={user.image} initials={initials} />
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          </div>
        </div>
        <div className="my-1 h-px bg-border" />
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
        >
          <LogOutIcon className="size-4" />
          Log out
        </button>
      </PopoverContent>
    </Popover>
  );
}

function Avatar({ image, initials }: { image?: string | null; initials: string }) {
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-xs font-medium text-muted-foreground"
    >
      {image ? (
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </span>
  );
}

function getInitials(source: string): string {
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
