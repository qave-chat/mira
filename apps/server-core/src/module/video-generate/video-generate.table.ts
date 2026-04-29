import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { VideoGeneratePhase } from "./video-generate.schema";

export const videoGenerateExecutions = pgTable(
  "video_generate_executions",
  {
    id: text("id").primaryKey(),
    executionId: text("execution_id"),
    prompt: text("prompt").notNull(),
    status: text("status").$type<"running" | "succeeded" | "failed">().notNull(),
    phase: text("phase").$type<VideoGeneratePhase>().notNull(),
    message: text("message").notNull(),
    progress: integer("progress").notNull(),
    videoKey: text("video_key"),
    error: text("error"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("video_generate_executions_execution_id_idx").on(table.executionId)],
);
