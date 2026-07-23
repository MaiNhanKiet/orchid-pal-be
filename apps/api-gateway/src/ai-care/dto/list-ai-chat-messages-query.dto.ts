import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ListAiChatMessagesQueryDto {
  @ApiPropertyOptional({ default: 30, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Load messages older than this message id (scroll-up pagination)',
  })
  @IsOptional()
  @IsUUID()
  before?: string;
}
