CREATE TABLE IF NOT EXISTS "ai_chat_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "topic" VARCHAR(200) DEFAULT 'New Conversation',
    "related_plant_id" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ai_chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT,
    "image_url" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_ai_chat_sessions_user_updated"
ON "ai_chat_sessions"("user_id", "updated_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_ai_chat_messages_session_created"
ON "ai_chat_messages"("session_id", "created_at");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_chat_sessions_user_id_fkey'
    ) THEN
        ALTER TABLE "ai_chat_sessions"
        ADD CONSTRAINT "ai_chat_sessions_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_chat_sessions_related_plant_id_fkey'
    ) THEN
        ALTER TABLE "ai_chat_sessions"
        ADD CONSTRAINT "ai_chat_sessions_related_plant_id_fkey"
        FOREIGN KEY ("related_plant_id") REFERENCES "my_plants"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ai_chat_messages_session_id_fkey'
    ) THEN
        ALTER TABLE "ai_chat_messages"
        ADD CONSTRAINT "ai_chat_messages_session_id_fkey"
        FOREIGN KEY ("session_id") REFERENCES "ai_chat_sessions"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;
