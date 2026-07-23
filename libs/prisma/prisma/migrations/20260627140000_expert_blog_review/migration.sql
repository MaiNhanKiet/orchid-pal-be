ALTER TABLE "expert_blogs"
ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT';

ALTER TABLE "expert_blogs"
ADD COLUMN IF NOT EXISTS "reviewed_by" UUID;

ALTER TABLE "expert_blogs"
ADD COLUMN IF NOT EXISTS "reviewed_at" TIMESTAMP(6);

ALTER TABLE "expert_blogs"
ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;

UPDATE "expert_blogs"
SET "status" = 'PUBLISHED'
WHERE "is_published" = true;

UPDATE "expert_blogs"
SET "status" = 'DRAFT'
WHERE "is_published" = false AND ("status" IS NULL OR "status" = 'DRAFT');

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'expert_blogs_reviewed_by_fkey'
    ) THEN
        ALTER TABLE "expert_blogs"
        ADD CONSTRAINT "expert_blogs_reviewed_by_fkey"
        FOREIGN KEY ("reviewed_by") REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_expert_blogs_status_created"
ON "expert_blogs"("status", "created_at" DESC);
