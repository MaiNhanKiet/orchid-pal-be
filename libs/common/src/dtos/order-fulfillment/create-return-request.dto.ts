import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefundBankInfoDto {
  @ApiProperty({ example: 'Vietcombank' })
  @IsString()
  @IsNotEmpty()
  bank_name: string;

  @ApiProperty({ example: '0123456789' })
  @IsString()
  @IsNotEmpty()
  account_number: string;

  @ApiProperty({ example: 'NGUYEN VAN A' })
  @IsString()
  @IsNotEmpty()
  account_holder: string;
}

export class CreateReturnRequestDto {
  @ApiProperty({ description: 'ID của đơn hàng cần trả' })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'Lý do trả hàng' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Danh sách URL ảnh bằng chứng',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({
    type: RefundBankInfoDto,
    description: 'Thông tin tài khoản ngân hàng để hoàn tiền (bắt buộc với COD)',
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => RefundBankInfoDto)
  refund_bank_info?: RefundBankInfoDto;
}

export class RejectReturnRequestDto {
  @ApiProperty({ description: 'Lý do từ chối' })
  @IsString()
  @IsNotEmpty()
  note: string;
}
