import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateAiChatSessionDto {
  @ApiPropertyOptional({ example: 'Orchid humidity help' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  topic?: string;

  @ApiPropertyOptional({ description: 'Link session to a plant for richer context' })
  @IsOptional()
  @IsUUID()
  plant_id?: string;
}
