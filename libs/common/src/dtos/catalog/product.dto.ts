import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    example: 'LAN-CTRL-001',
    description: 'Mã SKU duy nhất của sản phẩm',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku: string;

  @ApiProperty({ example: 'Bộ điều khiển tưới tự động cho lan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    example:
      'Bộ điều khiển IoT chuyên dụng cho trồng lan, hỗ trợ đo độ ẩm, nhiệt độ, ánh sáng...',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 1250000, description: 'Giá bán (VND)' })
  @IsNumber({ allowInfinity: false, maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiProperty({ example: 50, description: 'Số lượng tồn kho ban đầu' })
  @IsNumber()
  @IsPositive()
  @IsOptional() // có thể để 0 nếu chưa nhập hàng
  stock_quantity?: number = 0;

  @ApiPropertyOptional({
    example: {
      dimensions: { length: 15, width: 10, height: 5 },
      weight: 0.8,
      power: '5V DC',
      sensors: ['temperature', 'humidity', 'light'],
      controllers: ['pump', 'fan', 'shade'],
    },
    description: 'Cấu hình chi tiết kỹ thuật (JSON)',
  })
  @IsObject()
  @IsOptional()
  specs_config?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/images/lan-controller.jpg',
  })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiProperty({
    example: true,
    description: 'Có hiển thị sản phẩm trên website không',
  })
  @IsBoolean()
  @IsOptional()
  is_published?: boolean = true;
}

export class UpdateProductDto {
  @ApiPropertyOptional({
    example: 'LAN-CTRL-001-UPDATED',
    description: 'Mã SKU mới (nếu thay đổi)',
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({
    example: 'Bộ điều khiển tưới tự động cho lan - phiên bản 2',
  })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example:
      'Phiên bản nâng cấp: thêm cảm biến CO2 và điều khiển quạt mạnh hơn...',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 1450000, description: 'Giá bán mới (VND)' })
  @IsNumber({ allowInfinity: false, maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(1) // tùy chọn: giữ ràng buộc giá tối thiểu nếu cần
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    example: 30,
    description: 'Cập nhật số lượng tồn kho',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  stock_quantity?: number;

  @ApiPropertyOptional({
    example: {
      dimensions: { length: 16, width: 11, height: 6 },
      weight: 0.9,
      power: '5V DC, 3A',
      sensors: ['temperature', 'humidity', 'light', 'co2'],
      controllers: ['pump', 'fan', 'shade', 'extra_relay'],
    },
    description:
      'Cập nhật cấu hình kỹ thuật (ghi đè toàn bộ hoặc merge tùy logic service)',
  })
  @IsObject()
  @IsOptional()
  specs_config?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/images/lan-controller-v2.jpg',
  })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Ẩn sản phẩm khỏi website',
  })
  @IsBoolean()
  @IsOptional()
  is_published?: boolean;
}
