import {
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { ShipmentStatus } from '@app/common/enums';

export class UpdateShipmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  carrier_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tracking_code?: string;

  @IsOptional()
  @IsNumber()
  shipping_fee?: number;

  @IsOptional()
  @IsEnum(ShipmentStatus, {
    message:
      'status must be a valid ShipmentStatus (READY, PICKED_UP, DELIVERING, DELIVERED, RETURNED)',
  })
  status?: ShipmentStatus;

  @IsOptional()
  @IsDateString()
  estimated_delivery_at?: string;
}
