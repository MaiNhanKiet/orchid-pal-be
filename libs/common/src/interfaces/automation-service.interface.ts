export interface PlantWiki {
  id: string;
  common_name: string;
  ideal_temp_min: number | null;
  ideal_temp_max: number | null;
  ideal_humid_min: number | null;
  ideal_humid_max: number | null;
}

/** @deprecated Use PlantWiki */
export type SpeciesWiki = PlantWiki;

export interface HardwareConfig {
  sensors?: {
    temperature?: boolean;
    humidity?: boolean;
    soil_moisture?: boolean;
    light?: boolean;
  };
  relays?: {
    relay_1?: string | null;
    relay_2?: string | null;
    relay_3?: string | null;
    relay_4?: string | null;
  };
}

/** NestJS DB/API logic shape for pump threshold rules. */
export interface PumpThresholdLogic {
  moisture_min?: number;
  water_duration_ms?: number;
  cooldown_ms?: number;
  enabled?: boolean;
}

/** ESP32 firmware logic rule shape (also accepted when updating rules via API). */
export interface FirmwareLogicRuleInput {
  if: {
    metric: string;
    op: string;
    value: number;
  };
  then: {
    action: string;
    duration_ms: number;
    cooldown_ms: number;
  };
}
