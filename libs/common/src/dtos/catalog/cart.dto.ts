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

export class CreateCartItemDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  productId: string;
  
  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class UpdateCartItemDto {
  @IsNumber()
  @IsPositive()
  @IsOptional()
  quantity?: number;

  @IsBoolean()
  @IsOptional()
  isSelected?: boolean;
}
