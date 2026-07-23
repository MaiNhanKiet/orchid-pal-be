import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

const FEEDBACK_CATEGORIES = ['bug', 'feature', 'product', 'general'] as const;

export class CreateFeedbackDto {
  @ApiProperty({ enum: FEEDBACK_CATEGORIES, example: 'general' })
  @IsString()
  @IsIn(FEEDBACK_CATEGORIES)
  category!: (typeof FEEDBACK_CATEGORIES)[number];

  @ApiPropertyOptional({ example: 'Mai Kiet' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'The humidity chart is hard to read on mobile.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  message!: string;

  @ApiPropertyOptional({ example: 'landing' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;

  @ApiPropertyOptional({ description: 'Authenticated user id (optional)' })
  @IsOptional()
  @IsUUID()
  user_id?: string;
}
