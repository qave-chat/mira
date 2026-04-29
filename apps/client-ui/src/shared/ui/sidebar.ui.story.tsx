import type { Meta, StoryObj } from "@storybook/react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/shared/ui/sidebar.ui";

const meta: Meta<typeof Sidebar> = {
  title: "Shared/UI/Sidebar",
  component: Sidebar,
};

export default meta;

type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <div className="px-2 py-1.5 text-sm font-medium">Mira</div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<button>Item one</button>} />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<button>Item two</button>} />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex items-center gap-2 p-2">
          <SidebarTrigger />
          <span className="text-sm">Main content</span>
        </div>
      </SidebarInset>
    </SidebarProvider>
  ),
};
