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
