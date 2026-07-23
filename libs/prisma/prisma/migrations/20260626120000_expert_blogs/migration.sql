-- expert_blogs (idempotent — table may already exist from db pull)
CREATE TABLE IF NOT EXISTS "expert_blogs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "author_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "tags" JSONB DEFAULT '[]',
    "views_count" INTEGER DEFAULT 0,
    "is_published" BOOLEAN DEFAULT false,
    "published_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_blogs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "expert_blogs_slug_key" ON "expert_blogs"("slug");
CREATE INDEX IF NOT EXISTS "idx_blogs_slug" ON "expert_blogs"("slug");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'expert_blogs_author_id_fkey'
    ) THEN
        ALTER TABLE "expert_blogs"
        ADD CONSTRAINT "expert_blogs_author_id_fkey"
        FOREIGN KEY ("author_id") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;
