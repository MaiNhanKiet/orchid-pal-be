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

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ allowInfinity: false, maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional() // có thể để 0 nếu chưa nhập hàng
  stock_quantity?: number = 0;

  @IsObject()
  @IsOptional()
  specs_config?: Record<string, any>;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsBoolean()
  @IsOptional()
  is_published?: boolean = true;
}

export class UpdateProductDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  sku?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ allowInfinity: false, maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(1) // tùy chọn: giữ ràng buộc giá tối thiểu nếu cần
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  stock_quantity?: number;

  @IsObject()
  @IsOptional()
  specs_config?: Record<string, any>;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsBoolean()
  @IsOptional()
  is_published?: boolean;
}
