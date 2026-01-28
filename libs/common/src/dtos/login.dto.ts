import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDTO {
  @IsString()
  @IsNotEmpty()
  token: string;
}
