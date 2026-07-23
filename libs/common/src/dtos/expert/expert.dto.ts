import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
export class CreateConversationDto {
  @ApiPropertyOptional({ description: 'ID cây liên quan' })
  @IsUUID()
  @IsOptional()
  related_plant_id?: string;

  @ApiPropertyOptional({ example: 'Cây bị vàng lá' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  topic?: string;
}

export class SendExpertMessageDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  image_urls?: string[];
}

export class CreateExpertBlogDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  slug: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  cover_image_url?: string;

  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Submit for admin review instead of saving as draft',
  })
  @IsOptional()
  @IsBoolean()
  submit_for_review?: boolean;
}

export class UpdateExpertBlogDto {
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  cover_image_url?: string;

  @IsOptional()
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  submit_for_review?: boolean;
}

export class ReviewExpertBlogDto {
  @ApiProperty({ description: 'true = approve and publish, false = reject' })
  @IsBoolean()
  approve: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejection_reason?: string;
}
