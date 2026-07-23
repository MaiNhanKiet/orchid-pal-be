export enum Role {
  SuperAdmin = 'SUPER_ADMIN',
  SystemAdmin = 'SYSTEM_ADMIN',
  Auditor = 'AUDITOR',
  StoreManager = 'STORE_MANAGER',
  PlantExpert = 'PLANT_EXPERT',
  /** @deprecated Use PlantExpert — kept for existing imports */
  OrchidExpert = 'PLANT_EXPERT',
  IoTTechnician = 'IOT_TECH',
  Customer = 'CUSTOMER',
}

export const EXPERT_ROLE_NAMES = [Role.PlantExpert, 'ORCHID_EXPERT'] as const;
