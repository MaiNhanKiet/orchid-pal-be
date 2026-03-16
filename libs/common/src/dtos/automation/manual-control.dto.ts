import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class ManualControlEventDto {
  @ApiProperty({ example: 'SN-ORCHID-0001' })
  @IsString()
  @IsNotEmpty()
  serial_number: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  relay_number: number;

  @ApiProperty({ example: 'pump' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({ example: 'ON', enum: ['ON', 'OFF'] })
  @IsIn(['ON', 'OFF'])
  action: 'ON' | 'OFF';

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  zone_id: string;
}
