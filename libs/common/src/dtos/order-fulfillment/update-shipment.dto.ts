import {
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
  IsNumber,
} from 'class-validator';

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
  @IsString()
  @MaxLength(20)
  status?: string;

  @IsOptional()
  @IsDateString()
  estimated_delivery_at?: string;
}
