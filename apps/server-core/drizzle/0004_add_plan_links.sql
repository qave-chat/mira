ALTER TABLE "plans" ADD COLUMN "links" jsonb DEFAULT '[]'::jsonb NOT NULL;
