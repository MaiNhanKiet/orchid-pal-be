import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => value.trim())
  description: string;
}
