import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  description: string;
}

export class UpdateRoleCommandDto {
  @IsNotEmpty()
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;
}
