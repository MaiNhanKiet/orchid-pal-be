import {
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
  IsObject,
  IsEnum,
} from 'class-validator';
import { TransactionStatus } from '@app/common/enums';

export class UpdateTransactionDto {
  @IsOptional()
  @IsEnum(TransactionStatus, {
    message:
      'status must be a valid TransactionStatus (PENDING, SUCCESS, FAILED, REFUNDED)',
  })
  status?: TransactionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  gateway_trans_id?: string;

  @IsOptional()
  @IsObject()
  gateway_log?: Record<string, any>;

  @IsOptional()
  @IsDateString()
  paid_at?: string;
}
