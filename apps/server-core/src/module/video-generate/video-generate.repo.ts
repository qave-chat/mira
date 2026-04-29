import { eq, sql } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { Db } from "../../platform/db.contract";
import type {
  VideoGenerateExecutionPatch,
  VideoGenerateExecutionRow,
} from "./video-generate.schema";
import { videoGenerateExecutions } from "./video-generate.table";

export class VideoGenerateRepo extends Context.Service<VideoGenerateRepo>()(
  "module/VideoGenerateRepo",
  {
    make: Effect.gen(function* () {
      const db = yield* Db;
      return {
        insert: Effect.fn("VideoGenerateRepo.insert")(function* (
          row: Omit<VideoGenerateExecutionRow, "createdAt" | "updatedAt">,
        ) {
          yield* Effect.annotateCurrentSpan({ "video-generate.id": row.id });
          const inserted = yield* db.query((d) =>
            d.insert(videoGenerateExecutions).values(row).returning(),
          );
          return inserted[0];
        }),
        updateById: Effect.fn("VideoGenerateRepo.updateById")(function* (
          id: string,
          patch: VideoGenerateExecutionPatch,
        ) {
          yield* Effect.annotateCurrentSpan({ "video-generate.id": id });
          const updated = yield* db.query((d) =>
            d
              .update(videoGenerateExecutions)
              .set({ ...patch, updatedAt: sql`now()` })
              .where(eq(videoGenerateExecutions.id, id))
              .returning(),
          );
          return updated[0];
        }),
        getByExecutionId: Effect.fn("VideoGenerateRepo.getByExecutionId")(function* (
          executionId: string,
        ) {
          yield* Effect.annotateCurrentSpan({ "video-generate.execution.id": executionId });
          const rows = yield* db.query((d) =>
            d
              .select()
              .from(videoGenerateExecutions)
              .where(eq(videoGenerateExecutions.executionId, executionId))
              .limit(1),
          );
          return rows[0];
        }),
      } as const;
    }),
  },
) {}

export const VideoGenerateRepoLive = Layer.effect(VideoGenerateRepo, VideoGenerateRepo.make);
