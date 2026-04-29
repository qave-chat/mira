ALTER TABLE "plans" ADD COLUMN "title" text;
UPDATE "plans" SET "title" = left("intent", 64) WHERE "title" IS NULL;
ALTER TABLE "plans" ALTER COLUMN "title" SET NOT NULL;
