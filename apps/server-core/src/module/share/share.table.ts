import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const generatedVideos = pgTable("generated_videos", {
  id: text("id").primaryKey(),
  sourceUrl: text("source_url").notNull(),
  videoUrl: text("video_url").notNull(),
  status: text("status").$type<"ready">().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const shares = pgTable(
  "shares",
  {
    id: text("id").primaryKey(),
    generatedVideoId: text("generated_video_id").notNull(),
    sourceUrl: text("source_url").notNull(),
    videoUrl: text("video_url").notNull(),
    status: text("status").$type<"ready">().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("shares_generated_video_id_idx").on(table.generatedVideoId)],
);

export const shareComments = pgTable(
  "share_comments",
  {
    id: text("id").primaryKey(),
    shareId: text("share_id").notNull(),
    authorName: text("author_name").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("share_comments_share_id_idx").on(table.shareId)],
);
