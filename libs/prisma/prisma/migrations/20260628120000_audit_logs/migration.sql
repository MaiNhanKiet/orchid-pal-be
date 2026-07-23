CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "actor_email" VARCHAR(255),
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "resource_id" VARCHAR(100),
    "metadata" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'audit_logs_user_id_fkey'
    ) THEN
        ALTER TABLE "audit_logs"
        ADD CONSTRAINT "audit_logs_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at"
ON "audit_logs"("created_at" DESC);

CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_created"
ON "audit_logs"("user_id", "created_at" DESC);
