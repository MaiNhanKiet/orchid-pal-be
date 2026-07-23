import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsObject, IsUUID, Min } from 'class-validator';

export class UpdateAutomationRulesDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID thiết bị (Kit)' })
  device_id: string;

  @IsInt()
  @Min(1)
  @ApiProperty({ description: 'Cổng relay (1-4)' })
  relay_port: number;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID người dùng' })
  user_id: string;

  @IsObject()
  @IsNotEmpty()
  @ApiProperty({ description: 'Cấu hình logic cho relay' })
  logic: Record<string, unknown>;
}

export class UpdateAutomationRulesBodyDto extends PickType(
  UpdateAutomationRulesDto,
  ['logic', 'relay_port'] as const,
) {}

export class RefreshAutomationByPlantDto {
  @IsUUID()
  @IsNotEmpty()
  plant_id: string;

  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
