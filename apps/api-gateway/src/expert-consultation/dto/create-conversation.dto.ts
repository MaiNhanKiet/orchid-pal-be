import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: 'Expert user ID' })
  @IsUUID()
  @IsNotEmpty()
  expert_id: string;

  @ApiPropertyOptional({ description: 'Related plant ID' })
  @IsUUID()
  @IsOptional()
  related_plant_id?: string;

  @ApiPropertyOptional({ example: 'Yellowing leaves on my orchid' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  topic?: string;
}
