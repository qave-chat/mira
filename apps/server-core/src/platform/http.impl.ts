import { Layer } from "effect";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import { HealthHttpHandlers } from "../module/health/health.http.impl";
import { ShareHttpHandlers } from "../module/share/share.http.impl";
import { ShareServiceLive } from "../module/share/share.service";
import { SessionsHttpHandlers } from "../module/sessions/sessions.http.impl";
import { SessionsRepoLive } from "../module/sessions/sessions.repo";
import { SessionsServiceLive } from "../module/sessions/sessions.service";
import { AuthHttpHandlers } from "./auth/auth.http.impl";
import { AuthLive } from "./auth/auth.impl";
import { DbLive } from "./db.impl";
import { HttpApiDef } from "./http.contract";

const ApiRoutes = HttpApiBuilder.layer(HttpApiDef, {
  openapiPath: "/api/http/openapi.json",
}).pipe(
  Layer.provide(
    Layer.mergeAll(
      AuthHttpHandlers.pipe(Layer.provide(AuthLive), Layer.provide(DbLive)),
      HealthHttpHandlers,
      ShareHttpHandlers.pipe(Layer.provide(ShareServiceLive)),
      SessionsHttpHandlers.pipe(
        Layer.provide(AuthLive),
        Layer.provide(SessionsServiceLive),
        Layer.provide(SessionsRepoLive),
        Layer.provide(DbLive),
      ),
    ),
  ),
);

const DocsRoute = HttpApiScalar.layer(HttpApiDef, { path: "/api/http/docs" });

export const HttpApiLive = Layer.mergeAll(ApiRoutes, DocsRoute);
