import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AnalyzeSeasonalConfigDto {
  @ApiProperty({
    description: 'The ID of the planting zone (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  zoneId: string;


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
