import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  MqttContext,
  Payload,
} from '@nestjs/microservices';
import { TelemetryServiceService } from './telemetry-service.service';

@Controller()
export class TelemetryServiceController {
  constructor(private readonly telemetryService: TelemetryServiceService) { }

  @MessagePattern('device/+/telemetry')
  async handleTelemetryData(@Payload() data: any, @Ctx() context: MqttContext) {
    const topic = context.getTopic();

    const topicParts = topic.split('/');
    const serialNumber = topicParts[1];

    if (serialNumber) {
      await this.telemetryService.saveTelemetryData(serialNumber, data);
    }
  }

  @MessagePattern({ cmd: 'get_latest_telemetry' })
  async getLatestTelemetry(@Payload() payload: { serialNumber: string }) {
    const data = await this.telemetryService.getLatestTelemetry(
      payload.serialNumber,
    );
    return data ? data : null;
  }

  @MessagePattern({ cmd: 'get_history_telemetry' })
  async getHistoryTelemetry(
    @Payload() payload: { serialNumber: string; hours: number },
  ) {
    const hours = payload.hours ? Number(payload.hours) : 24;
    const data = await this.telemetryService.getHistoryTelemetry(
      payload.serialNumber,
      hours,
    );
    return data;
  }

  @MessagePattern({ cmd: 'analyze_seasonal_config' })
  async analyzeSeasonalConfig(
    @Payload() payload: { zoneId: string; days?: number },
  ) {
    const days = payload.days || 3;
    return this.telemetryService.geminianalyzeSeasonalConfig(payload.zoneId, days);
  }
}
