import {
  IsString,
  IsNotEmpty,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActivateDeviceDto {
  @ApiProperty({
    example: 'SN-1234567890',
    description: 'Số serial của thiết bị (từ QR code)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serial_number: string;

  @ApiProperty({
    example: 'secret-key-abc123xyz',
    description: 'Secret key của thiết bị (từ QR code)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  secret_key: string;
}

export class ActivateDeviceCommandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serial_number: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  secret_key: string;

  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}

export class GetDeviceStatusCommandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serial_number: string;
}

export class AssignDeviceToZoneDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID của vườn (zone) muốn gán thiết bị vào',
  })
  @IsUUID()
  @IsNotEmpty()
  zone_id: string;
}

export class AssignDeviceToZoneCommandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serial_number: string;

  @IsUUID()
  @IsNotEmpty()
  zone_id: string;

  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}