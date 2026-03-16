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
  constructor(private readonly telemetryService: TelemetryServiceService) {}

  @MessagePattern('device/+/telemetry')
  async handleTelemetryData(@Payload() data: any, @Ctx() context: MqttContext) {
    const topic = context.getTopic();

    const topicParts = topic.split('/');
    const serialNumber = topicParts[1];

    if (serialNumber) {
      await this.telemetryService.saveTelemetryData(serialNumber, data);
    }
  }
}
