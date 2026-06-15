import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class OrchidChatImageDto {
  @IsString()
  @IsNotEmpty()
  base64: string;

  @IsOptional()
  @IsString()
  mimeType?: string;

  @IsOptional()
  @IsString()
  originalName?: string;
}

export class OrchidChatPayloadDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrchidChatImageDto)
  image?: OrchidChatImageDto;
}
