import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class ListConversationsQueryDto {
  @ApiPropertyOptional({ enum: ['all', 'pending', 'active', 'archived'] })
  @IsOptional()
  @IsIn(['all', 'pending', 'active', 'archived'])
  filter?: 'all' | 'pending' | 'active' | 'archived';
}
