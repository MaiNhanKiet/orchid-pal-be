import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class DeviceActionLogEventDto {
  @IsString()
  @IsNotEmpty()
  action: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsNumber()
  relay_number: number;

  @IsString()
  @IsNotEmpty()
  trigger_reason: string;

  @IsNumber()
  @IsOptional()
  value?: number;
}
