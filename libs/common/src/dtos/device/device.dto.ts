import {
  IsString,
  IsNotEmpty,
  IsUUID,
  MaxLength,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../pagination.dto';

export class ActivateDeviceDto {
  @ApiProperty({
    example: 'SN-1234567890',
    description: 'Số serial của thiết bị (từ QR code)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serial_number: string;

  @ApiProperty({
    example: 'secret-key-abc123xyz',
    description: 'Secret key của thiết bị (từ QR code)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  secret_key: string;
}

export class ActivateDeviceCommandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serial_number: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  secret_key: string;

  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}

export class GetDeviceStatusCommandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serial_number: string;
}

export class AssignDeviceToZoneDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID của vườn (zone) muốn gán thiết bị vào',
  })
  @IsUUID()
  @IsNotEmpty()
  zone_id: string;
}

export class ControlDeviceDto {
  @ApiProperty({
    example: 'pump',
    description: "Role relay cần điều khiển ('pump', 'fan', 'light')",
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    example: 'ON',
    description: "Hành động điều khiển relay ('ON' | 'OFF')",
  })
  @IsString()
  @IsNotEmpty()
  action: 'ON' | 'OFF';
}

export class ManualControlDeviceCommandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serial_number: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsNotEmpty()
  action: 'ON' | 'OFF';
}

export class AssignDeviceToZoneCommandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serial_number: string;

  @IsUUID()
  @IsNotEmpty()
  zone_id: string;

  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}

export class CreateDeviceDto {
  @ApiProperty({
    example: 'SN-1234567890',
    description: 'Serial number duy nhất của thiết bị',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serial_number: string;

  @ApiProperty({
    example: 'secret-key-abc123xyz',
    description: 'Secret key để kích hoạt thiết bị',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  secret_key: string;

  @ApiPropertyOptional({
    example: 'product-uuid',
    description: 'ID sản phẩm (model thiết bị) nếu có',
  })
  @IsUUID()
  @IsOptional()
  product_id?: string;
}

export class UpdateDeviceDto {
  @ApiProperty({
    example: 'device-uuid',
    description: 'ID của thiết bị cần cập nhật',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({
    example: 'SN-NEW-1234567890',
    description: 'Serial number mới (nếu muốn đổi)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  serial_number?: string;

  @ApiPropertyOptional({
    example: 'NEW-SECRET-KEY',
    description: 'Secret key mới (nếu muốn reset)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  secret_key?: string;

  @ApiPropertyOptional({
    example: 'product-uuid',
    description: 'ID sản phẩm (model thiết bị) nếu có',
  })
  @IsUUID()
  @IsOptional()
  product_id?: string;

  @ApiPropertyOptional({
    example: 'ONLINE',
    description: 'Trạng thái thiết bị (INACTIVE, OFFLINE, ONLINE, ...)',
  })
  @IsString()
  @IsOptional()
  status?: string;
}

export class QueryDevicesDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'SN-123',
    description:
      'Tìm kiếm theo serial_number (contains, không phân biệt hoa thường)',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'ONLINE',
    description: 'Lọc theo trạng thái thiết bị',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({
    example: 'owner-uuid',
    description: 'Lọc theo owner_id',
  })
  @IsUUID()
  @IsOptional()
  owner_id?: string;

  @ApiPropertyOptional({
    example: 'zone-uuid',
    description: 'Lọc theo zone_id',
  })
  @IsUUID()
  @IsOptional()
  zone_id?: string;

  @ApiPropertyOptional({
    example: 'product-uuid',
    description: 'Lọc theo product_id',
  })
  @IsUUID()
  @IsOptional()
  product_id?: string;

  @ApiPropertyOptional({
    example: 'created_at',
    description:
      'Trường dùng để sort (created_at, serial_number, status, last_online_at)',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'created_at' | 'serial_number' | 'status' | 'last_online_at';

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Thứ tự sắp xếp (asc, desc)',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class AddDevicesToProductDto {
  @ApiProperty({
    example: 'shared-secret-key-123',
    description: 'Secret key dùng chung cho tất cả các thiết bị được tạo ra',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  secretKey: string;

  @ApiProperty({
    example: 5,
    description: 'Số lượng thiết bị cần tạo',
    type: Number,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}