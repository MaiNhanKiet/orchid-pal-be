ALTER TABLE "device_watering_schedules" DROP CONSTRAINT IF EXISTS "device_watering_schedules_device_id_fkey";

DROP TABLE IF EXISTS "device_watering_schedules";

ALTER TABLE "devices" DROP COLUMN IF EXISTS "watering_mode";
