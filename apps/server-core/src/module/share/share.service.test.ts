import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { ShareService, ShareServiceLive } from "./share.service";

describe("ShareService", () => {
  it.effect("creates a share and anonymous comment", () =>
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

      assert.strictEqual(result.share.id, share.id);
      assert.strictEqual(result.comments[0]?.id, comment.id);
    }).pipe(Effect.provide(ShareServiceLive)),
  );
});
