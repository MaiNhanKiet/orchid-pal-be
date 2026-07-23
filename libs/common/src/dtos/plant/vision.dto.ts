import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AnalyzePlantSetupDto {
  @ApiPropertyOptional({ description: 'URL ảnh góc đặt cây (nếu đã upload)' })
  @IsString()
  @IsOptional()
  setup_image_url?: string;
}
