import { PaymentMethod } from '@app/common/enums/payment.enum';
import { IsEnum, IsOptional, IsUUID, IsString } from 'class-validator';

export class CheckoutDto {
  @IsEnum(PaymentMethod)
  paymentMethod;

  @IsUUID()
  @IsOptional()
  addressId?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
