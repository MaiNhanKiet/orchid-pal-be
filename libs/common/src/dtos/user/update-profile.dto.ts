import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  full_name?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: 'https://lh3.googleusercontent.com/a/avatar' })
  @IsOptional()
  @IsString()
  avatar_url?: string;

  @ApiPropertyOptional({ example: { theme: 'light', notifications: true } })
  @IsOptional()
  @IsObject()
  preferences?: Record<string, unknown>;
}
