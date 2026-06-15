import { SkipTimeout } from '@app/common';
import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  MqttContext,
  Payload,
} from '@nestjs/microservices';
import { OrchidChatPayloadDto } from '../dto/orchid-chat.dto';
import { TelemetryService } from './telemetry.service';

@Controller()
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) { }

  @MessagePattern('device/+/telemetry')
  async handleTelemetryData(@Payload() data: any, @Ctx() context: MqttContext) {
    const topic = context.getTopic();

    const topicParts = topic.split('/');
    const serialNumber = topicParts[1];

    if (serialNumber) {
      await this.telemetryService.saveTelemetryData(serialNumber, data);
    }
  }

  @GrpcCmd('get_latest_telemetry')
  async getLatestTelemetry(@Payload() payload: { serialNumber: string }) {
    const data = await this.telemetryService.getLatestTelemetry(
      payload.serialNumber,
    );
    return data ? data : null;
  }

  @GrpcCmd('get_history_telemetry')
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

  @GrpcCmd('analyze_seasonal_config')
  async analyzeSeasonalConfig(
    @Payload() payload: { zoneId: string; days?: number },
  ) {
    const days = payload.days || 3;
    return this.telemetryService.geminianalyzeSeasonalConfig(payload.zoneId, days);
  }

  @GrpcCmd('orchid_chat')
  @SkipTimeout()
  async orchidChat(@Payload() payload: OrchidChatPayloadDto) {
    return this.telemetryService.orchidChat(payload);
  }
}
