import { GrpcCmd } from '@app/grpc';
import { MQTT_DEVICE_SUBSCRIBE, extractSerialFromMqttTopic } from '@app/common/constants/mqtt-topics.constant';
import { Controller } from '@nestjs/common';
import { Ctx, MessagePattern, MqttContext, Payload } from '@nestjs/microservices';
import { TelemetryService } from './telemetry.service';

@Controller()
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @MessagePattern(MQTT_DEVICE_SUBSCRIBE.telemetry)
  async handleTelemetryData(@Payload() data: Record<string, unknown>, @Ctx() context: MqttContext) {
    const serialNumber = extractSerialFromMqttTopic(context.getTopic());
    if (serialNumber) {
      await this.telemetryService.saveTelemetryData(serialNumber, data);
    }
  }

  @GrpcCmd('get_latest_telemetry')
  getLatestTelemetry(@Payload() payload: { serialNumber: string }) {
    return this.telemetryService.getLatestTelemetry(payload.serialNumber);
  }

  @GrpcCmd('get_history_telemetry')
  getHistoryTelemetry(@Payload() payload: { serialNumber: string; hours: number }) {
    return this.telemetryService.getHistoryTelemetry(
      payload.serialNumber,
      Number(payload.hours ?? 24),
    );
  }

  @GrpcCmd('get_telemetry_by_plant')
  getTelemetryByPlant(
    @Payload() payload: { plant_id: string; user_id: string; hours?: number },
  ) {
    return this.telemetryService.getTelemetryByPlant(
      payload.plant_id,
      payload.user_id,
      payload.hours,
    );
  }
}
