import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AnalyzeSeasonalConfigDto {
  @ApiProperty({ description: 'The ID of the planting zone' })
  @IsNotEmpty()
  @IsString()
  zoneId: string;

  @ApiProperty({
    description: 'The current hardware configuration to be analyzed',
  })
  @IsNotEmpty()
  @IsObject()
  currentConfig: Record<string, any>;

  @ApiProperty({
    description: 'Number of past days to analyze (default 3)',
    required: false,
    default: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  days?: number;
}
