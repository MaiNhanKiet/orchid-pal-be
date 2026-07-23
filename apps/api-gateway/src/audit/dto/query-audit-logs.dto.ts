import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '@app/common';

export class QueryAuditLogsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  module?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  entity?: string;

  @IsOptional()
  @IsIn(['SUCCESS', 'FAILED', 'WARNING'])
  status?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsIn(['created_at', 'action', 'module', 'status'])
  sort_by?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class ExportAuditLogsDto extends QueryAuditLogsDto {
  @IsOptional()
  @IsIn(['csv', 'xlsx', 'pdf'])
  format?: 'csv' | 'xlsx' | 'pdf' = 'csv';
}
