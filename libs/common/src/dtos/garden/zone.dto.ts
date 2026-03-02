import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateZoneDto {
  @ApiProperty({
    example: 'Vườn lan nhà tôi',
    description: 'Tên vườn',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'Hà Nội',
    description: 'Thành phố nơi đặt vườn',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  location_city: string;

  @ApiPropertyOptional({
    example: 'FULL_SUN',
    description: 'Mức độ tiếp xúc ánh sáng (FULL_SUN, PARTIAL_SHADE, FULL_SHADE)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  exposure?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/garden-image.jpg',
    description: 'URL hình ảnh vườn',
  })
  @IsString()
  @IsOptional()
  image_url?: string;
}

export class CreateZoneCommandDto extends CreateZoneDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID của người dùng sở hữu vườn (lấy từ JWT, không phải client gửi)',
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}

export class UpdateZoneDto {
  @ApiPropertyOptional({
    example: 'Vườn lan nhà tôi - Cập nhật',
    description: 'Tên vườn mới',
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
    description: 'Mức độ tiếp xúc ánh sáng',
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  exposure?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/garden-image-updated.jpg',
    description: 'URL hình ảnh vườn mới',
  })
  @IsString()
  @IsOptional()
  image_url?: string;
}

export class UpdateZoneCommandDto {
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
  exposure?: string;

  @IsString()
  @IsOptional()
  image_url?: string;
}
