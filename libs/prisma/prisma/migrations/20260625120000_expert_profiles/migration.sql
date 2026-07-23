CREATE TABLE IF NOT EXISTS "expert_profiles" (
  "user_id" UUID NOT NULL,
  "specialty" VARCHAR(200),
  "bio" TEXT,
  "location" VARCHAR(100),
  "tags" JSONB DEFAULT '[]',
  "experience_years" INTEGER,
  "is_available" BOOLEAN DEFAULT true,
  "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "expert_profiles_pkey" PRIMARY KEY ("user_id")
);

ALTER TABLE "expert_profiles"
  ADD CONSTRAINT "expert_profiles_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;
