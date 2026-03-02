import { IsOptional, IsString, MaxLength, IsObject } from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

  @IsOptional()
  @IsObject()
  shipping_info?: Record<string, any>;

  @IsOptional()
  @IsString()
  note?: string;
}
