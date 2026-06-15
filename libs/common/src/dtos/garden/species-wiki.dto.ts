import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSpeciesWikiDto {
  @ApiProperty({
    example: 'Phalaenopsis',
    description: 'Tên thường gọi của loài lan',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  common_name: string;

  @ApiPropertyOptional({
    example: 'Phalaenopsis amabilis',
    description: 'Tên khoa học của loài lan',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  scientific_name?: string;

  @ApiPropertyOptional({
    example: 'Herbs',
    description: 'Loại cây (Herbs, Flowers, Veggies, ...)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  plant_category?: string;

  @ApiPropertyOptional({
    example: 20.0,
    description: 'Nhiệt độ tối thiểu lý tưởng (°C)',
  })
  @IsNumber()
  @IsOptional()
  ideal_temp_min?: number;

  @ApiPropertyOptional({
    example: 28.0,
    description: 'Nhiệt độ tối đa lý tưởng (°C)',
  })
  @IsNumber()
  @IsOptional()
  ideal_temp_max?: number;

  @ApiPropertyOptional({
    example: 50.0,
    description: 'Độ ẩm tối thiểu lý tưởng (%)',
  })
  @IsNumber()
  @IsOptional()
  ideal_humid_min?: number;

  @ApiPropertyOptional({
    example: 70.0,
    description: 'Độ ẩm tối đa lý tưởng (%)',
  })
  @IsNumber()
  @IsOptional()
  ideal_humid_max?: number;

  @ApiPropertyOptional({
    example: 'Cần ánh sáng gián tiếp, tưới nước 2-3 lần/tuần',
    description: 'Hướng dẫn chăm sóc chi tiết',
  })
  @IsString()
  @IsOptional()
  care_instruction?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/phalaenopsis.jpg',
    description: 'Ảnh minh họa loài cây',
  })
  @IsString()
  @IsOptional()
  image_url?: string;
}

export class CreateSpeciesWikiCommandDto extends CreateSpeciesWikiDto {
  @IsUUID()
  @IsNotEmpty()
  author_id: string;
}

export class UpdateSpeciesWikiDto {
  @ApiPropertyOptional({
    example: 'Phalaenopsis',
    description: 'Tên thường gọi của loài lan',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  common_name?: string;

  @ApiPropertyOptional({
    example: 'Phalaenopsis amabilis',
    description: 'Tên khoa học của loài lan',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  scientific_name?: string;

  @ApiPropertyOptional({
    example: 'Flowers',
    description: 'Loại cây (Herbs, Flowers, Veggies, ...)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  plant_category?: string;

  @ApiPropertyOptional({
    example: 20.0,
    description: 'Nhiệt độ tối thiểu lý tưởng (°C)',
  })
  @IsNumber()
  @IsOptional()
  ideal_temp_min?: number;

  @ApiPropertyOptional({
    example: 28.0,
    description: 'Nhiệt độ tối đa lý tưởng (°C)',
  })
  @IsNumber()
  @IsOptional()
  ideal_temp_max?: number;

  @ApiPropertyOptional({
    example: 50.0,
    description: 'Độ ẩm tối thiểu lý tưởng (%)',
  })
  @IsNumber()
  @IsOptional()
  ideal_humid_min?: number;

  @ApiPropertyOptional({
    example: 70.0,
    description: 'Độ ẩm tối đa lý tưởng (%)',
  })
  @IsNumber()
  @IsOptional()
  ideal_humid_max?: number;

  @ApiPropertyOptional({
    example: 'Cần ánh sáng gián tiếp, tưới nước 2-3 lần/tuần',
    description: 'Hướng dẫn chăm sóc chi tiết',
  })
  @IsString()
  @IsOptional()
  care_instruction?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/phalaenopsis.jpg',
    description: 'Ảnh minh họa loài lan',
  })
  @IsString()
  @IsOptional()
  image_url?: string;
}

export class UpdateSpeciesWikiCommandDto extends UpdateSpeciesWikiDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
