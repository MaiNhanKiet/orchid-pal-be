import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  MaxLength,
  IsEnum,
} from 'class-validator';

export enum AddressType {
  HOME = 'HOME',
  OFFICE = 'OFFICE',
}

export class CreateAddressDto {
  @IsString()
  @MaxLength(100)
  recipient_name: string;

  @IsString()
  @MaxLength(20)
  phone: string;

  @IsString()
  @MaxLength(255)
  street: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  ward?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  district?: string;

  @IsString()
  @MaxLength(100)
  city: string;

  @IsBoolean()
  @IsOptional()
  is_default?: boolean = false;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  ghn_district_id?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  ghn_ward_code?: string;

  @ApiProperty({
    enum: AddressType,
    example: AddressType.HOME,
    required: false,
  })
  @IsEnum(AddressType)
  @IsOptional()
  type?: AddressType;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
