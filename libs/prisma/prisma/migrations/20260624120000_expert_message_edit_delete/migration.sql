ALTER TABLE "expert_messages" ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN DEFAULT false;
ALTER TABLE "expert_messages" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(6);
ALTER TABLE "expert_messages" ADD COLUMN IF NOT EXISTS "edited_at" TIMESTAMP(6);
ALTER TABLE "expert_messages" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(6);
