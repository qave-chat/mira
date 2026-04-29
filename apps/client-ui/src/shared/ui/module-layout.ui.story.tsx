import type { Meta, StoryObj } from "@storybook/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { Building2Icon } from "lucide-react";
import {
  ModuleLayout,
  ModuleLayoutActions,
  ModuleLayoutBody,
  ModuleLayoutHeader,
  ModuleLayoutSidebar,
  ModuleLayoutTitle,
} from "./module-layout.ui";
import { SidebarProvider } from "./sidebar.ui";

function withRouter(
  children: React.ReactNode,
  navItems: React.ComponentProps<typeof ModuleLayoutSidebar>["navItems"] = [],
) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const homeRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <SidebarProvider>
        <ModuleLayoutSidebar navItems={navItems} />
        {children}
      </SidebarProvider>
    ),
  });
  const companyRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/company",
    component: () => (
      <SidebarProvider>
        <ModuleLayoutSidebar navItems={navItems} />
        {children}
      </SidebarProvider>
    ),
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([homeRoute, companyRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return <RouterProvider router={router} />;
}

const meta: Meta<typeof ModuleLayout> = {
  title: "Shared/UI/ModuleLayout",
  component: ModuleLayout,
};

export default meta;

type Story = StoryObj<typeof ModuleLayout>;

export const Default: Story = {
  render: () =>
    withRouter(
      <ModuleLayout>
        <ModuleLayoutHeader>
          <ModuleLayoutTitle>Mira</ModuleLayoutTitle>
        </ModuleLayoutHeader>
        <ModuleLayoutBody>
          <ul className="flex flex-col gap-2">
            <li className="rounded border p-2 text-sm">Item one</li>
            <li className="rounded border p-2 text-sm">Item two</li>
          </ul>
        </ModuleLayoutBody>
      </ModuleLayout>,
      [{ href: "/company", label: "Companies", icon: <Building2Icon />, isActive: true }],
    ),
};

export const WithActions: Story = {
  render: () =>
    withRouter(
      <ModuleLayout>
        <ModuleLayoutHeader>
          <ModuleLayoutTitle>Mira</ModuleLayoutTitle>
          <ModuleLayoutActions>
            <input
              type="text"
              placeholder="Filter by name…"
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none"
            />
          </ModuleLayoutActions>
        </ModuleLayoutHeader>
        <ModuleLayoutBody>
          <ul className="flex flex-col gap-2">
            {Array.from({ length: 30 }, (_, i) => (
              <li key={i} className="rounded border p-2 text-sm">
                Item {i + 1}
              </li>
            ))}
          </ul>
        </ModuleLayoutBody>
      </ModuleLayout>,
      [{ href: "/company", label: "Companies", icon: <Building2Icon />, isActive: true }],
    ),
};

export const WithNavigation: Story = {
  render: () =>
    withRouter(
      <ModuleLayout>
        <ModuleLayoutHeader>
          <ModuleLayoutTitle>Companies</ModuleLayoutTitle>
        </ModuleLayoutHeader>
        <ModuleLayoutBody>
          <div className="rounded border p-2 text-sm">Company content</div>
        </ModuleLayoutBody>
      </ModuleLayout>,
    ),
};

export const EmptyBody: Story = {
  render: () =>
    withRouter(
      <ModuleLayout>
        <ModuleLayoutHeader>
          <ModuleLayoutTitle>Mira</ModuleLayoutTitle>
        </ModuleLayoutHeader>
        <ModuleLayoutBody>
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Nothing here yet.
          </div>
        </ModuleLayoutBody>
      </ModuleLayout>,
    ),
};
