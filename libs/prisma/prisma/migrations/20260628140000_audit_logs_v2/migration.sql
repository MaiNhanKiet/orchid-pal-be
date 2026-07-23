-- Audit logs v2: full business audit schema (idempotent)

CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "username" VARCHAR(255),
    "full_name" VARCHAR(120),
    "role" VARCHAR(200),
    "module" VARCHAR(100),
    "entity" VARCHAR(100),
    "entity_id" VARCHAR(100),
    "action" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "request_method" VARCHAR(10),
    "endpoint" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    "response_code" INTEGER,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_email" VARCHAR(255),
    "resource" VARCHAR(100),
    "resource_id" VARCHAR(100),
    "metadata" JSONB,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "username" VARCHAR(255);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "full_name" VARCHAR(120);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "role" VARCHAR(200);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "module" VARCHAR(100);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "entity" VARCHAR(100);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "entity_id" VARCHAR(100);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "old_data" JSONB;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "new_data" JSONB;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "user_agent" VARCHAR(500);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "request_method" VARCHAR(10);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "endpoint" VARCHAR(500);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) NOT NULL DEFAULT 'SUCCESS';
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "response_code" INTEGER;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "duration_ms" INTEGER;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "actor_email" VARCHAR(255);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "resource" VARCHAR(100);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "resource_id" VARCHAR(100);
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

UPDATE "audit_logs" SET "entity" = "resource" WHERE "entity" IS NULL AND "resource" IS NOT NULL;
UPDATE "audit_logs" SET "entity_id" = "resource_id" WHERE "entity_id" IS NULL AND "resource_id" IS NOT NULL;
UPDATE "audit_logs" SET "username" = "actor_email" WHERE "username" IS NULL AND "actor_email" IS NOT NULL;
UPDATE "audit_logs" SET "new_data" = "metadata" WHERE "new_data" IS NULL AND "metadata" IS NOT NULL;
UPDATE "audit_logs" SET "status" = 'SUCCESS' WHERE "status" IS NULL;

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

CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_id" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_module" ON "audit_logs"("module");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity" ON "audit_logs"("entity");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_status" ON "audit_logs"("status");
CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user_created" ON "audit_logs"("user_id", "created_at" DESC);
