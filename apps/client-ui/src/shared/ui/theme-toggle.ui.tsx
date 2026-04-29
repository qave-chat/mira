import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/shared/ui/button.ui";

export function ThemeToggle({
  resolvedTheme,
  onToggle,
}: {
  readonly resolvedTheme: "dark" | "light";
  readonly onToggle: () => void;
}) {
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={onToggle}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  );
}
