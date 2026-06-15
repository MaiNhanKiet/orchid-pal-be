import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationDto } from '../pagination.dto';

export class GetMyPlantsDto extends PaginationDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}

export class GetPlantsByZoneDto {
  @IsUUID()
  @IsNotEmpty()
  zone_id: string;
}

export class CreateMyPlantDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174111',
    description: 'ID loài cây trong plant_wiki mà người dùng chọn',
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
    example: 'Plastic',
    description: 'Loại chậu/chứa (Hanging, Plastic, Foam, ...)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  container_type?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/my-orchid.jpg',
    description: 'Ảnh chụp chậu cây (tuỳ chọn)',
  })
  @IsString()
  @IsOptional()
  image_url?: string;
}

export class AssignPlantToZoneDto {
  @ApiProperty({
    example: 'plant_id',
    description: 'ID của cây cần gán',
  })
  @IsUUID()
  @IsNotEmpty()
  plant_id: string;

  @ApiProperty({
    example: 'zone_id',
    description: 'ID của zone (vườn) cần gán cây vào',
  })
  @IsUUID()
  @IsNotEmpty()
  zone_id: string;
}

export class AssignPlantToZoneCommandDto extends AssignPlantToZoneDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
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

export class UpdateMyPlantDto {
  @ApiPropertyOptional({
    example: 'Cô nàng Hồ Điệp số 2',
    description: 'Tên gọi riêng/nickname mới cho chậu cây này',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nickname?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/my-orchid-new.jpg',
    description: 'Ảnh chụp mới của chậu cây',
  })
  @IsString()
  @IsOptional()
  image_url?: string;
}
