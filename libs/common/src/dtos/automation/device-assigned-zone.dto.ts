import { IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

export class DeviceAssignedZoneEventDto {
  @IsUUID()
  @IsNotEmpty()
  device_id: string;

  @IsUUID()
  @IsOptional()
  zone_id: string | null;

  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
