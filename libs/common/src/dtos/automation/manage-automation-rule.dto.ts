import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ManageAutomationRuleDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Automation rule UUID' })
  rule_id: string;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Owner user UUID' })
  user_id: string;
}
