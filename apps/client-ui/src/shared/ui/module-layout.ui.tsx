import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/shared/ui/logo.ui";
import { ScrollArea } from "@/shared/ui/scroll-area.ui";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/shared/ui/sidebar.ui";
import { cn } from "@/shared/util/cn.util";

export function ModuleLayoutSidebar({
  footer,
  headerActions,
  headerExtra,
  navItems = [],
}: {
  footer?: React.ReactNode;
  headerActions?: React.ReactNode;
  headerExtra?: React.ReactNode;
  navItems?: ReadonlyArray<{
    readonly href: string;
    readonly label: string;
    readonly icon?: React.ReactNode;
    readonly isActive?: boolean;
  }>;
}) {
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1.5 py-1">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md hover:text-sidebar-accent-foreground"
          >
            <Logo />
            <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">Mira</span>
          </Link>
          {headerExtra ? (
            <span className="flex items-center group-data-[collapsible=icon]:hidden">
              {headerExtra}
            </span>
          ) : null}
          {headerActions ? (
            <span className="ml-auto flex items-center group-data-[collapsible=icon]:hidden">
              {headerActions}
            </span>
          ) : null}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={item.isActive}
                      tooltip={item.label}
                      render={
                        <Link to={item.href}>
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      {footer && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>{footer}</SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  );
}

export type ModuleLayoutProps = React.ComponentProps<"section">;

export function ModuleLayout({ className, children, ...props }: ModuleLayoutProps) {
  return (
    <SidebarInset>
      <section
        data-slot="module-layout"
        className={cn("flex min-h-0 w-full flex-1 flex-col", className)}
        {...props}
      >
        {children}
      </section>
    </SidebarInset>
  );
}

export type ModuleLayoutHeaderProps = React.ComponentProps<"header">;

export function ModuleLayoutHeader({ className, children, ...props }: ModuleLayoutHeaderProps) {
  return (
    <header
      data-slot="module-layout-header"
      className={cn("flex h-12 shrink-0 items-center gap-3 border-b px-4", className)}
      {...props}
    >
      <SidebarTrigger />
      {children}
    </header>
  );
}

export type ModuleLayoutTitleProps = React.ComponentProps<"h1">;

export function ModuleLayoutTitle({ className, ...props }: ModuleLayoutTitleProps) {
  return (
    <h1
      data-slot="module-layout-title"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  );
}

export type ModuleLayoutActionsProps = React.ComponentProps<"div">;

export function ModuleLayoutActions({ className, ...props }: ModuleLayoutActionsProps) {
  return (
    <div
      data-slot="module-layout-actions"
      className={cn("ml-auto flex items-center gap-2", className)}
      {...props}
    />
  );
}

export type ModuleLayoutBodyProps = React.ComponentProps<typeof ScrollArea> & {
  contentClassName?: string;
};

export function ModuleLayoutBody({
  className,
  contentClassName,
  children,
  ...props
}: ModuleLayoutBodyProps) {
  return (
    <ScrollArea
      data-slot="module-layout-body"
      className={cn("min-h-0 flex-1", className)}
      {...props}
    >
      <div className={cn("flex min-h-full flex-col gap-4 p-6", contentClassName)}>{children}</div>
    </ScrollArea>
  );
}
