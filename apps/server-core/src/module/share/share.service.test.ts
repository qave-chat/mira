import { assert, describe, it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { Db } from "../../platform/db.contract";
import { makeTestDb } from "../../platform/db.impl";
import { ShareRepoLive } from "./share.repo";
import { ShareService, ShareServiceLive } from "./share.service";

const TestDbLive = Layer.effect(
  Db,
  Effect.promise(() => makeTestDb()),
);

const TestLive = ShareServiceLive.pipe(Layer.provide(ShareRepoLive), Layer.provide(TestDbLive));

const provide = <A, E>(effect: Effect.Effect<A, E, ShareService>) =>
  effect.pipe(Effect.provide(TestLive));

describe("ShareService", () => {
  it.effect("creates a share and anonymous comment", () =>
    provide(
      Effect.gen(function* () {
        const service = yield* ShareService;
        const generatedVideo = yield* service.createGeneratedVideo({
          sourceUrl: "https://example.com/video.mp4",
        });
        const share = yield* service.create({ generatedVideoId: generatedVideo.id });
        const comment = yield* service.createComment(share.id, {
          authorName: "Kevin",
          body: "Looks good",
        });
        const result = yield* service.get(share.id);

        assert.match(generatedVideo.id, /^gvi_[0-9A-Za-z]{27}$/);
        assert.match(share.id, /^shr_[0-9A-Za-z]{27}$/);
        assert.strictEqual(result.share.id, share.id);
        assert.strictEqual(result.comments[0]?.id, comment.id);
      }),
    ),
  );
});
