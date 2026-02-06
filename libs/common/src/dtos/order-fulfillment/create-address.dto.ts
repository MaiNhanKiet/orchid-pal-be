import { PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

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

  @IsString()
  @MaxLength(20)
  @IsOptional()
  type?: string;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}