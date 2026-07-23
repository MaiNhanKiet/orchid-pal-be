import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../pagination.dto';

export class CreatePlantDto {
  @ApiProperty({ example: 'Chậu lan Phalaenopsis' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nickname: string;

  @ApiPropertyOptional({ example: 'Phalaenopsis' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  species_name?: string;

  @ApiPropertyOptional({ example: 'Đà Nẵng' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  location_city?: string;

  @ApiPropertyOptional({ description: 'Ảnh góc đặt cây (URL sau khi upload)' })
  @IsString()
  @IsOptional()
  setup_image_url?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsDateString()
  @IsOptional()
  planted_at?: string;
}

export class CreatePlantCommandDto extends CreatePlantDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsObject()
  @IsOptional()
  ai_space_analysis?: object;

  @IsObject()
  @IsOptional()
  ai_suggested_thresholds?: object;
}

export class UpdatePlantDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nickname?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  species_name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  location_city?: string;

  @IsString()
  @IsOptional()
  setup_image_url?: string;

  @IsObject()
  @IsOptional()
  ai_space_analysis?: object;

  @IsObject()
  @IsOptional()
  ai_suggested_thresholds?: object;
}

export class GetMyPlantsDto extends PaginationDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
