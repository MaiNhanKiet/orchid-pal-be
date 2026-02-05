import { IsEnum, IsOptional, IsUUID, IsString } from 'class-validator';

export class CheckoutDto {
  @IsEnum(['PAYOS', 'COD'])
  paymentMethod: 'PAYOS' | 'COD';

  @IsUUID()
  @IsOptional()
  addressId?: string;

  @IsString()
  @IsOptional()
  note?: string;
}
