import { useEffect } from "react";
import { AsyncResult } from "effect/unstable/reactivity";
import { HttpClient } from "@mira/client-api/http-atom";
import type { HealthStatus } from "@/module/health/health.ui";
import { useAtomRefresh, useAtomValue } from "@effect/atom-react";

const HEALTH_POLL_MS = 5000;

export function useHealthStatus(): HealthStatus {
  const atom = HttpClient.query("health", "live", {
    reactivityKeys: ["health"],
  });
  const result = useAtomValue(atom);
  const refresh = useAtomRefresh(atom);

  useEffect(() => {
    const id = setInterval(refresh, HEALTH_POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return AsyncResult.match(result, {
    onInitial: () => "loading",
    onSuccess: () => "ok",
    onFailure: () => "down",
  });
}
