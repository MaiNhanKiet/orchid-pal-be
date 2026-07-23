CREATE TABLE IF NOT EXISTS "feedbacks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category" VARCHAR(50) NOT NULL,
    "name" VARCHAR(120),
    "email" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "source" VARCHAR(50) DEFAULT 'landing',
    "user_id" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_feedbacks_created_at" ON "feedbacks"("created_at");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'feedbacks_user_id_fkey'
    ) THEN
        ALTER TABLE "feedbacks"
        ADD CONSTRAINT "feedbacks_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;
