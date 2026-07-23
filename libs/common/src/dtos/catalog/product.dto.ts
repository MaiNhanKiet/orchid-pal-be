import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
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

  @IsObject()
  @IsOptional()
  features_json?: Record<string, unknown>;

  /** FE admin form alias — stored as features_json */
  @IsObject()
  @IsOptional()
  specs_config?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  buy_link?: string;

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
  @IsOptional()
  price?: number;

  @IsObject()
  @IsOptional()
  features_json?: Record<string, unknown>;

  /** FE admin form alias — stored as features_json */
  @IsObject()
  @IsOptional()
  specs_config?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  buy_link?: string;

  @IsBoolean()
  @IsOptional()
  is_published?: boolean;
}
