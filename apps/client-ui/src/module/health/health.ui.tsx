import { cn } from "@/shared/util/cn.util";

export type HealthStatus = "ok" | "down" | "loading";

export function HealthDot({ status, className }: { status: HealthStatus; className?: string }) {
  const label =
    status === "ok"
      ? "Server healthy"
      : status === "down"
        ? "Server unreachable"
        : "Checking server";
  return (
    <span
      data-slot="health-dot"
      data-status={status}
      role="status"
      aria-label={label}
      title={label}
      className={cn("relative inline-flex size-2.5 items-center justify-center", className)}
    >
      {status === "ok" && (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
      )}
      <span
        className={cn(
          "relative inline-flex size-2 rounded-full",
          status === "ok" && "bg-emerald-500",
          status === "down" && "bg-red-500",
          status === "loading" && "bg-muted-foreground",
        )}
      />
    </span>
  );
}
