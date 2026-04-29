CREATE TABLE "generated_videos" (
	"id" text PRIMARY KEY NOT NULL,
	"source_url" text NOT NULL,
	"video_url" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"share_id" text NOT NULL,
	"author_name" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shares" (
	"id" text PRIMARY KEY NOT NULL,
	"generated_video_id" text NOT NULL,
	"source_url" text NOT NULL,
	"video_url" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_generate_executions" (
	"id" text PRIMARY KEY NOT NULL,
	"execution_id" text,
	"prompt" text NOT NULL,
	"status" text NOT NULL,
	"phase" text NOT NULL,
	"message" text NOT NULL,
	"progress" integer NOT NULL,
	"video_key" text,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "share_comments_share_id_idx" ON "share_comments" USING btree ("share_id");--> statement-breakpoint
CREATE INDEX "shares_generated_video_id_idx" ON "shares" USING btree ("generated_video_id");--> statement-breakpoint
CREATE INDEX "video_generate_executions_execution_id_idx" ON "video_generate_executions" USING btree ("execution_id");