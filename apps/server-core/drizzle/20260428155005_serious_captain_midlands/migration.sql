CREATE TABLE "company_check" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"group_id" text NOT NULL,
	"group_label" text NOT NULL,
	"label" text NOT NULL,
	"status" text NOT NULL,
	"detail" text,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_check_insight" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"check_definition_id" text NOT NULL,
	"insight_id" text NOT NULL,
	"run_id" text NOT NULL,
	"relationship" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_check_override" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"check_definition_id" text NOT NULL,
	"status" text NOT NULL,
	"score" integer NOT NULL,
	"detail" text,
	"rationale" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_check_run" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"status" text NOT NULL,
	"engine_version" text NOT NULL,
	"input_hash" text NOT NULL,
	"reason" text NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_engine_check" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"check_definition_id" text NOT NULL,
	"group_id" text NOT NULL,
	"group_label" text NOT NULL,
	"label" text NOT NULL,
	"status" text NOT NULL,
	"score" integer NOT NULL,
	"detail" text,
	"rationale" text NOT NULL,
	"run_id" text NOT NULL,
	"engine_version" text NOT NULL,
	"input_hash" text NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_source" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"confidence" integer NOT NULL,
	"selected" boolean DEFAULT false NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_source_insight" (
	"id" text PRIMARY KEY,
	"company_id" text NOT NULL,
	"source_id" text NOT NULL,
	"kind" text NOT NULL,
	"locator" text,
	"text" text NOT NULL,
	"extractor_version" text DEFAULT 'seed-v1' NOT NULL,
	"insight_workflow_run_id" text DEFAULT 'seed' NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
