import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class TelemetrySensorsDto {
    temp: number | null;
    humid: number | null;
    soil: number | null;
    light: number | null;
}

export class TelemetryEventDto {
    serialNumber: string;
    timestamp: string;
    sensors: TelemetrySensorsDto;
}


export class GetLatestTelemetryDto {
    @ApiProperty({
        example: 'SN-1234567890',
        description: 'Serial number của thiết bị',
    })
    @IsString()
    serialNumber: string;
}

export class GetHistoryTelemetryDto {
    @ApiProperty({
        example: 'SN-1234567890',
        description: 'Serial number của thiết bị',
    })
    @IsString()
    serialNumber: string;
}

export class GetHistoryTelemetryQueryDto {
    @ApiPropertyOptional({
        example: 24,
        description: 'Số giờ muốn lấy lịch sử telemetry (mặc định 24)',
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(168)
    hours?: number;
}
