import { IsOptional, IsString, MaxLength, IsObject, IsEnum } from 'class-validator';
import { OrderStatus } from '@app/common/enums';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'status must be a valid OrderStatus (PENDING, PAID, SHIPPING, COMPLETED, CANCELLED)' })
  status?: OrderStatus;

  @IsOptional()
  @IsObject()
  shipping_info?: Record<string, any>;

  @IsOptional()
  @IsString()
  note?: string;
}
