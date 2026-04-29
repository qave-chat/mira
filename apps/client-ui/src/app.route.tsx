import { createRootRoute, Outlet, redirect, useMatches, useRouter } from "@tanstack/react-router";
import { useAtomSet } from "@effect/atom-react";
import { Cause, Exit } from "effect";
import { CalendarDaysIcon } from "lucide-react";
import { HttpClient } from "@mira/client-api/http-atom";
import { AuthPopover } from "@/module/auth/ui/auth-popover.ui";
import { HealthDot } from "@/module/health/health.ui";
import { useHealthStatus } from "@/module/health/use-health-status.hook";
import { ThemeProvider, useTheme } from "@/shared/provider/theme.provider";
import { ModuleLayoutSidebar } from "@/shared/ui/module-layout.ui";
import { SidebarProvider } from "@/shared/ui/sidebar.ui";
import { ThemeToggle } from "@/shared/ui/theme-toggle.ui";
import { TooltipProvider } from "@/shared/ui/tooltip.ui";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
};

async function fetchSession(): Promise<{ user: SessionUser } | null> {
  try {
    const res = await fetch("/api/auth/get-session", { credentials: "include" });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text) return null;
    const parsed = JSON.parse(text) as { user?: SessionUser } | null;
    return parsed && parsed.user ? { user: parsed.user } : null;
  } catch {
    return null;
  }
}

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const isLogin = location.pathname === "/login";
    const isPublicShare = location.pathname.startsWith("/share/");
    const session = await fetchSession();
    if (!session && !isLogin && !isPublicShare) {
      // oxlint-disable-next-line effect-local/no-throw -- TanStack Router: redirect is raised via throw
      throw redirect({ to: "/login", search: () => ({}) });
    }
    if (session && isLogin) {
      // oxlint-disable-next-line effect-local/no-throw -- TanStack Router: redirect is raised via throw
      throw redirect({ to: "/" });
    }
    return { user: session?.user ?? null };
  },
  component: RootLayout,
});

function RootLayout() {
  const matches = useMatches();
  const isLogin = matches.some((m) => m.routeId === "/login");
  const isPublicShare = matches.some((m) => m.routeId.startsWith("/share/"));
  return (
    <ThemeProvider>
      <TooltipProvider>
        {isLogin || isPublicShare ? <Outlet /> : <AuthenticatedLayout />}
      </TooltipProvider>
    </ThemeProvider>
  );
}

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const matches = useMatches();
  const router = useRouter();
  const health = useHealthStatus();
  const { resolvedTheme, setTheme } = useTheme();
  const signOut = useAtomSet(HttpClient.mutation("auth", "signOut"), {
    mode: "promiseExit",
  });

  const handleLogout = async () => {
    const exit = await signOut({});
    if (Exit.isFailure(exit)) {
      console.error("Sign out failed:", Cause.pretty(exit.cause));
    }
    await router.invalidate();
    void router.navigate({ to: "/login", search: () => ({}) });
  };

  const handleThemeToggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <SidebarProvider>
      <ModuleLayoutSidebar
        footer={user ? <AuthPopover user={user} onLogout={handleLogout} /> : null}
        headerExtra={<HealthDot status={health} />}
        headerActions={<ThemeToggle resolvedTheme={resolvedTheme} onToggle={handleThemeToggle} />}
        navItems={[
          {
            href: "/sessions",
            label: "Sessions",
            icon: <CalendarDaysIcon />,
            isActive: matches.some((m) => m.routeId.startsWith("/sessions")),
          },
        ]}
      />
      <Outlet />
    </SidebarProvider>
  );
}
