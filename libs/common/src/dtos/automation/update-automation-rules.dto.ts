import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsUUID } from 'class-validator';

export class UpdateAutomationRulesDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID của khu vườn cần cập nhật',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  zone_id: string;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID người dùng thực hiện cập nhật',
    example: '123e4567-e89b-12d3-a456-426614174999',
  })
  user_id: string;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Mảng các rules logic cho thiết bị',
    example: [
      {
        if: { metric: 'humidity', op: '<', value: 40 },
        then: { action: 'pump', duration_ms: 10000 },
      },
    ],
  })
  logic: object[];
}

export class UpdateAutomationRulesBodyDto extends PickType(
  UpdateAutomationRulesDto,
  ['logic'] as const,
) {}

export class RefreshAutomationRulesByZoneDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID của khu vườn cần refresh automation rules',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  zone_id: string;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID người dùng thực hiện thao tác',
    example: '123e4567-e89b-12d3-a456-426614174999',
  })
  user_id: string;
}
