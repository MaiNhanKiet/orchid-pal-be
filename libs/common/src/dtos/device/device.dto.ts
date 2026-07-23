import {
  IsString,
  IsNotEmpty,
  IsUUID,
  MaxLength,
  IsOptional,
  IsArray,
  ArrayMinSize,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../pagination.dto';

export class ActivateDeviceDto {
  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID thiết bị (từ QR code, tham số `id`)',
  })
  @IsUUID()
  @IsOptional()
  device_id?: string;

  @ApiPropertyOptional({
    example: 'SN-1234567890',
    description: 'Số serial của thiết bị (legacy hoặc nhập tay)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  serial_number?: string;

  @ApiProperty({
    example: 'secret-key-abc123xyz',
    description: 'Secret key của thiết bị (từ QR code, tham số `key`)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  secret_key: string;
}

export class ActivateDeviceCommandDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  serial_number?: string;

  @IsUUID()
  @IsOptional()
  device_id?: string;

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

export class AssignDeviceToPlantDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID cây muốn gắn Kit (1 Kit = 1 cây)',
  })
  @IsUUID()
  @IsNotEmpty()
  plant_id: string;
}

export class AssignDeviceToUserDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'ID người dùng sẽ được gán Kit',
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}

export class AssignDeviceToUserCommandDto {
  @IsUUID()
  @IsNotEmpty()
  device_id: string;

  @IsUUID()
  @IsNotEmpty()
  user_id: string;
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
    description: "Relay control action ('ON' | 'OFF')",
  })
  @IsString()
  @IsNotEmpty()
  action: 'ON' | 'OFF';

  @ApiPropertyOptional({
    example: 1,
    description: 'Relay port (1-4). Used when role name does not match hardware.',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  relay_port?: number;
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

  @IsInt()
  @Min(1)
  @IsOptional()
  relay_port?: number;

  @IsUUID()
  @IsOptional()
  user_id?: string;
}

export class AssignDeviceToPlantCommandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  serial_number: string;

  @IsUUID()
  @IsNotEmpty()
  plant_id: string;

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

  @IsString()
  @IsOptional()
  current_firmware?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/.../kit-qr/device-uuid.png',
    description: 'URL ảnh QR kích hoạt trên Cloudinary',
  })
  @IsString()
  @IsOptional()
  qr_image_url?: string;
}

export class DeviceActivationQrResponseDto {
  @ApiProperty()
  device_id: string;

  @ApiProperty()
  serial_number: string;

  @ApiProperty()
  activation_payload: string;

  @ApiProperty()
  qr_image_url: string;
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
    example: 'plant-uuid',
    description: 'Lọc theo plant_id',
  })
  @IsUUID()
  @IsOptional()
  plant_id?: string;

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

export class ProvisionDevicesDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  secretKey: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsNotEmpty()
  skuPrefix: string;
}
