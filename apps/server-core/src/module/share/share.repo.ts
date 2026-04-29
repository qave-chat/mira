import { desc, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { Db } from "../../platform/db.contract";
import type { GeneratedVideoRow, ShareCommentRow, ShareRow } from "./share.schema";
import { generatedVideos, shareComments, shares } from "./share.table";

export class ShareRepo extends Context.Service<ShareRepo>()("module/ShareRepo", {
  make: Effect.gen(function* () {
    const db = yield* Db;
    return {
      insertGeneratedVideo: Effect.fn("ShareRepo.insertGeneratedVideo")(function* (
        row: Omit<GeneratedVideoRow, "createdAt" | "updatedAt">,
      ) {
        yield* Effect.annotateCurrentSpan({ "generated-video.id": row.id });
        const inserted = yield* db.query((d) => d.insert(generatedVideos).values(row).returning());
        return inserted[0];
      }),
      getGeneratedVideoById: Effect.fn("ShareRepo.getGeneratedVideoById")(function* (id: string) {
        yield* Effect.annotateCurrentSpan({ "generated-video.id": id });
        const rows = yield* db.query((d) =>
          d.select().from(generatedVideos).where(eq(generatedVideos.id, id)).limit(1),
        );
        return rows[0];
      }),
      insertShare: Effect.fn("ShareRepo.insertShare")(function* (
        row: Omit<ShareRow, "createdAt" | "updatedAt">,
      ) {
        yield* Effect.annotateCurrentSpan({ "share.id": row.id });
        const inserted = yield* db.query((d) => d.insert(shares).values(row).returning());
        return inserted[0];
      }),
      getShareByGeneratedVideoId: Effect.fn("ShareRepo.getShareByGeneratedVideoId")(function* (
        generatedVideoId: string,
      ) {
        yield* Effect.annotateCurrentSpan({ "generated-video.id": generatedVideoId });
        const rows = yield* db.query((d) =>
          d.select().from(shares).where(eq(shares.generatedVideoId, generatedVideoId)).limit(1),
        );
        return rows[0];
      }),
      getShareById: Effect.fn("ShareRepo.getShareById")(function* (id: string) {
        yield* Effect.annotateCurrentSpan({ "share.id": id });
        const rows = yield* db.query((d) =>
          d.select().from(shares).where(eq(shares.id, id)).limit(1),
        );
        return rows[0];
      }),
      insertComment: Effect.fn("ShareRepo.insertComment")(function* (
        row: Omit<ShareCommentRow, "createdAt" | "updatedAt">,
      ) {
        yield* Effect.annotateCurrentSpan({ "share.id": row.shareId });
        const inserted = yield* db.query((d) => d.insert(shareComments).values(row).returning());
        return inserted[0];
      }),
      listCommentsByShareId: Effect.fn("ShareRepo.listCommentsByShareId")(function* (
        shareId: string,
      ) {
        yield* Effect.annotateCurrentSpan({ "share.id": shareId });
        return yield* db.query((d) =>
          d
            .select()
            .from(shareComments)
            .where(eq(shareComments.shareId, shareId))
            .orderBy(desc(shareComments.createdAt)),
        );
      }),
    } as const;
  }),
}) {}

export const ShareRepoLive = Layer.effect(ShareRepo, ShareRepo.make);
