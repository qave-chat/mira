import { Config, Effect, Layer, Logger } from "effect";
import { RpcSerialization } from "effect/unstable/rpc";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { HttpRouter } from "effect/unstable/http";
import { HealthLive } from "./module/health/health.rpc.impl";
import { PlansGenerateLive } from "./module/plans/plans.generate.impl";
import { PlansRepoLive } from "./module/plans/plans.repo";
import { PlansLive } from "./module/plans/plans.rpc.impl";
import { PlansServiceLive } from "./module/plans/plans.service";
import { SessionsRepoLive } from "./module/sessions/sessions.repo";
import { SessionsServiceLive } from "./module/sessions/sessions.service";
import { VideoGenerateLive } from "./module/video-generate/video-generate.rpc.impl";
import { VideoGenerateRepoLive } from "./module/video-generate/video-generate.repo";
import { VideoGenerateRendererLive } from "./module/video-generate/video-generate.renderer";
import { VideoGenerateServiceLive } from "./module/video-generate/video-generate.service";
import { VideoGenerateWorkflowLive } from "./module/video-generate/video-generate.workflow";
import { AsrLive } from "./platform/asr.impl";
import { AuthCatchallLive } from "./platform/auth/auth.catchall";
import { AuthLive } from "./platform/auth/auth.impl";
import { DbLive } from "./platform/db.impl";
import { HttpApiLive } from "./platform/http.impl";
import { R2Live } from "./platform/r2.impl";
import { RpcLive } from "./platform/rpc.impl";
import { PgClientLive } from "./platform/sql.impl";
import { StaticLive } from "./platform/static.impl";
import { UploadLive } from "./platform/upload.impl";
import { WorkflowEngineOnlyLive } from "./platform/workflow.impl";

const VideoGenerateLayers = Layer.mergeAll(VideoGenerateLive, VideoGenerateWorkflowLive).pipe(
  Layer.provide(VideoGenerateServiceLive),
  Layer.provide(VideoGenerateRepoLive),
  Layer.provide(VideoGenerateRendererLive),
  Layer.provide(R2Live),
  Layer.provide(DbLive),
  Layer.provide(WorkflowEngineOnlyLive),
);

const PlansLayers = PlansLive.pipe(
  Layer.provide(PlansServiceLive),
  Layer.provide(PlansRepoLive),
  Layer.provide(SessionsServiceLive),
  Layer.provide(SessionsRepoLive),
  Layer.provide(R2Live),
  Layer.provide(AuthLive),
  Layer.provide(DbLive),
);

const PlanGenerateRoutes = PlansGenerateLive.pipe(
  Layer.provide(AuthLive),
  Layer.provide(PlansServiceLive),
  Layer.provide(PlansRepoLive),
  Layer.provide(SessionsServiceLive),
  Layer.provide(SessionsRepoLive),
  Layer.provide(DbLive),
);

const Handlers = Layer.mergeAll(HealthLive, VideoGenerateLayers, PlansLayers);

const AuthRoutes = AuthCatchallLive.pipe(Layer.provide(AuthLive), Layer.provide(DbLive));

const UploadRoutes = UploadLive.pipe(
  Layer.provide(AuthLive),
  Layer.provide(DbLive),
  Layer.provide(R2Live),
);

const HttpRoutes = Layer.mergeAll(
  AuthRoutes,
  AsrLive,
  HttpApiLive,
  UploadRoutes,
  PlanGenerateRoutes,
  StaticLive,
);

const AppLive = Layer.mergeAll(
  // NDJSON instead of JSON so streaming RPCs (SessionEventsWatch) can frame
  // chunks over the response body. JSON serializer emits a single value per
  // response and would buffer the stream until completion.
  RpcLive.pipe(Layer.provide(Handlers), Layer.provide(RpcSerialization.layerNdjson)),
  HttpRoutes,
);

const PortConfig = Config.int("PORT").pipe(Config.withDefault(38412));

const LoggerLive = Layer.unwrap(
  Effect.gen(function* () {
    const nodeEnv = yield* Config.string("NODE_ENV").pipe(Config.withDefault("development"));
    return nodeEnv === "production"
      ? Logger.layer([Logger.consoleLogFmt])
      : Logger.layer([Logger.consoleLogFmt]);
  }),
);

const ServerLive = Layer.unwrap(
  Effect.gen(function* () {
    const port = yield* PortConfig;
    return HttpRouter.serve(AppLive).pipe(
      Layer.provide(BunHttpServer.layer({ hostname: "0.0.0.0", port })),
    );
  }),
);

BunRuntime.runMain(
  Effect.gen(function* () {
    const port = yield* PortConfig;
    yield* Effect.log(`Server listening on http://0.0.0.0:${port}`);
    yield* Layer.launch(ServerLive);
  }).pipe(Effect.provide(PgClientLive), Effect.provide(LoggerLive)) as Effect.Effect<
    void,
    unknown,
    never
  >,
);
