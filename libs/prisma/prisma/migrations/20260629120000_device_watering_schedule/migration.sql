ALTER TABLE "devices" ADD COLUMN IF NOT EXISTS "watering_mode" VARCHAR(20);

CREATE TABLE IF NOT EXISTS "device_watering_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "device_id" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "start_time" VARCHAR(5) NOT NULL,
    "duration_sec" INTEGER NOT NULL,
    "repeat_days" JSONB NOT NULL,
    "last_run_at" TIMESTAMP(6),
    "run_until" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "device_watering_schedules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "device_watering_schedules_device_id_key"
ON "device_watering_schedules"("device_id");

ALTER TABLE "device_watering_schedules"
ADD CONSTRAINT "device_watering_schedules_device_id_fkey"
FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
