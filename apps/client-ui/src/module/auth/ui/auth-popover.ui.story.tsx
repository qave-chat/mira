import type { Meta, StoryObj } from "@storybook/react";

import { AuthPopover } from "@/module/auth/ui/auth-popover.ui";
import {
  Sidebar,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
} from "@/shared/ui/sidebar.ui";

const meta: Meta<typeof AuthPopover> = {
  title: "Module/Auth/AuthPopover",
  component: AuthPopover,
};

export default meta;

type Story = StoryObj<typeof AuthPopover>;

const user = { name: "Kevin Sucasa", email: "kevin@skiploans.com.au" };

function SidebarFrame({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>{children}</SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}

export const Default: Story = {
  render: () => (
    <SidebarFrame>
      <AuthPopover user={user} onLogout={() => {}} />
    </SidebarFrame>
  ),
};

export const LongName: Story = {
  render: () => (
    <SidebarFrame>
      <AuthPopover
        user={{
          name: "Alexandra Montgomery-Richardson",
          email: "alexandra.montgomery.richardson@example.com",
        }}
        onLogout={() => {}}
      />
    </SidebarFrame>
  ),
};
