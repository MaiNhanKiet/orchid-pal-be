import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBalconyZoneDto {
  @ApiProperty({
    example: 'Ban công phía Nam',
    description: 'Tên khu ban công',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'Hà Nội',
    description: 'Thành phố nơi đặt ban công',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  location_city: string;

  @ApiPropertyOptional({
    example: 'FULL_SUN',
    description:
      'Cường độ ánh sáng (FULL_SUN, PARTIAL_SHADE, FULL_SHADE)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  sunlight_intensity?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Ban công có mái che hay không',
  })
  @IsBoolean()
  @IsOptional()
  has_roof?: boolean;

  @ApiPropertyOptional({
    example: 'https://example.com/balcony-image.jpg',
    description: 'URL hình ảnh ban công',
  })
  @IsString()
  @IsOptional()
  image_url?: string;
}

/** @deprecated Use CreateBalconyZoneDto */
export class CreateZoneDto extends CreateBalconyZoneDto {}

export class CreateBalconyZoneCommandDto extends CreateBalconyZoneDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description:
      'ID của người dùng sở hữu ban công (lấy từ JWT, không phải client gửi)',
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}

/** @deprecated Use CreateBalconyZoneCommandDto */
export class CreateZoneCommandDto extends CreateBalconyZoneCommandDto {}

export class UpdateBalconyZoneDto {
  @ApiPropertyOptional({
    example: 'Ban công phía Nam - Cập nhật',
    description: 'Tên ban công mới',
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: 'TP. Hồ Chí Minh',
    description: 'Thành phố mới',
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  location_city?: string;

  @ApiPropertyOptional({
    example: 'PARTIAL_SHADE',
    description: 'Cường độ ánh sáng',
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  sunlight_intensity?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Ban công có mái che hay không',
  })
  @IsBoolean()
  @IsOptional()
  has_roof?: boolean;

  @ApiPropertyOptional({
    example: 'https://example.com/balcony-image-updated.jpg',
    description: 'URL hình ảnh ban công mới',
  })
  @IsString()
  @IsOptional()
  image_url?: string;
}

/** @deprecated Use UpdateBalconyZoneDto */
export class UpdateZoneDto extends UpdateBalconyZoneDto {}

export class UpdateBalconyZoneCommandDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  location_city?: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  sunlight_intensity?: string;

  @IsBoolean()
  @IsOptional()
  has_roof?: boolean;

  @IsString()
  @IsOptional()
  image_url?: string;
}

/** @deprecated Use UpdateBalconyZoneCommandDto */
export class UpdateZoneCommandDto extends UpdateBalconyZoneCommandDto {}
