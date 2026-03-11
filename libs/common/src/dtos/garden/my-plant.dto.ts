import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetPlantsByZoneDto {
  @IsUUID()
  @IsNotEmpty()
  zone_id: string;
}

export class CreateMyPlantDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID của zone (vườn) mà cây này thuộc về',
  })
  @IsUUID()
  @IsNotEmpty()
  zone_id: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174111',
    description: 'ID loài lan trong species_wiki mà người dùng chọn',
  })
  @IsUUID()
  @IsNotEmpty()
  species_id: string;

  @ApiPropertyOptional({
    example: 'Cô nàng Hồ Điệp số 1',
    description: 'Tên gọi riêng/nickname cho chậu cây này',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nickname?: string;

  @ApiPropertyOptional({
    example: '2025-01-01',
    description:
      'Ngày trồng cây (YYYY-MM-DD). Nếu không gửi, server sẽ tự set ngày hiện tại.',
  })
  @IsDateString()
  @IsOptional()
  planted_at?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/my-orchid.jpg',
    description: 'Ảnh chụp chậu cây (tuỳ chọn)',
  })
  @IsString()
  @IsOptional()
  image_url?: string;
}

export class CreateMyPlantCommandDto extends CreateMyPlantDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174999',
    description:
      'ID của người dùng sở hữu cây (lấy từ JWT, không phải client gửi)',
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
