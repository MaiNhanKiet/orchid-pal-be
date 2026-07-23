import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CHAT_MAX_MESSAGE_LENGTH } from '../chat.constants';

export class SendMessageDto {
  @ApiProperty({ description: 'Conversation room ID' })
  @IsUUID()
  @IsNotEmpty()
  conversation_id: string;

  @ApiPropertyOptional({ description: 'Client-generated id for delivery tracking' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  client_message_id?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(CHAT_MAX_MESSAGE_LENGTH)
  content?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  image_urls?: string[];
}
