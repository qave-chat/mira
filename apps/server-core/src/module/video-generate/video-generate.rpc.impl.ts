import { Effect } from "effect";
import { VideoGenerateRpcs } from "./video-generate.rpc.contract";
import { VideoGenerateService } from "./video-generate.service";

export const VideoGenerateLive = VideoGenerateRpcs.toLayer(
  Effect.gen(function* () {
    const service = yield* VideoGenerateService;
    return {
      VideoGenerateStart: Effect.fn("Rpc.VideoGenerateStart")(function* (input) {
        return yield* service.start(input).pipe(Effect.catchTags({ ErrorDb: Effect.die }));
      }),
      VideoGenerateGet: Effect.fn("Rpc.VideoGenerateGet")(function* ({ executionId }) {
        return yield* service
          .get(executionId)
          .pipe(Effect.catchTags({ ErrorDb: Effect.die, ErrorR2: Effect.die }));
      }),
    };
  }),
);
