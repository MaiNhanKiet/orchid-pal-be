import {
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
  IsObject,
} from 'class-validator';

export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  status?: string;

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
