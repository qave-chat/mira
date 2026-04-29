import { HttpApi, OpenApi } from "effect/unstable/httpapi";
import { HealthHttpGroup } from "../module/health/health.http.contract";
import { AuthHttpGroup } from "./auth/auth.http.contract";

export { AuthHttpGroup } from "./auth/auth.http.contract";
export { HealthHttpGroup } from "../module/health/health.http.contract";

export class HttpApiDef extends HttpApi.make("server-core")
  .add(AuthHttpGroup)
  .add(HealthHttpGroup)
  .prefix("/api/http")
  .annotateMerge(
    OpenApi.annotations({
      title: "server-core public API",
      description: "Public HTTP endpoints: health, readiness, docs.",
    }),
  ) {}
