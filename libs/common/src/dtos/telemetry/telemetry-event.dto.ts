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
