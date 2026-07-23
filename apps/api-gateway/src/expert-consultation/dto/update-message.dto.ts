import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CHAT_MAX_MESSAGE_LENGTH } from '../chat.constants';

export class UpdateMessageDto {
  @ApiProperty({ description: 'Updated message text' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(CHAT_MAX_MESSAGE_LENGTH)
  content: string;
}
