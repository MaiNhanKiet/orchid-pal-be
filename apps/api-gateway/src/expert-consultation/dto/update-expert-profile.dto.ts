import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateExpertProfileDto {
  @ApiPropertyOptional({ example: 'Orchid Specialist' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  full_name?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'Phalaenopsis & Dendrobium care' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  specialty?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({ example: 'Ho Chi Minh City' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ type: [String], example: ['orchid', 'disease'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @MaxLength(40, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(60)
  experience_years?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_available?: boolean;
}
