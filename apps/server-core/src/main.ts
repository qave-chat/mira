import { Config, Effect, Layer, Logger } from "effect";
import { RpcSerialization } from "effect/unstable/rpc";
import { BunHttpServer, BunRuntime } from "@effect/platform-bun";
import { HttpRouter } from "effect/unstable/http";
import { HealthLive } from "./module/health/health.rpc.impl";
import { AuthCatchallLive } from "./platform/auth/auth.catchall";
import { AuthLive } from "./platform/auth/auth.impl";
import { DbLive } from "./platform/db.impl";
import { HttpApiLive } from "./platform/http.impl";
import { RpcLive } from "./platform/rpc.impl";
import { StaticLive } from "./platform/static.impl";

const Handlers = HealthLive;

const AuthRoutes = AuthCatchallLive.pipe(Layer.provide(AuthLive), Layer.provide(DbLive));

const HttpRoutes = Layer.mergeAll(AuthRoutes, HttpApiLive, StaticLive);

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
  }).pipe(Effect.provide(LoggerLive)),
);
