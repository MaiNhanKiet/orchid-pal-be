import { DeviceAssignedZoneEventDto, RmqService } from '@app/common';
import { Controller, Inject } from '@nestjs/common';
import {
  ClientProxy,
  Ctx,
  EventPattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { AutomationServiceService } from './automation-service.service';

@Controller()
export class AutomationServiceController {
  constructor(
    private readonly automationServiceService: AutomationServiceService,
    private readonly rmqService: RmqService,
    @Inject('MQTT_CLIENT') private readonly mqttClient: ClientProxy,
  ) { }

  @EventPattern('device.assigned.zone')
  async handleDeviceAssigned(
    @Payload() data: DeviceAssignedZoneEventDto,
    @Ctx() context: RmqContext,
  ) {
    await this.automationServiceService.handleDeviceAssignedZone(data);
    this.rmqService.ack(context);
  }

  @EventPattern('send.manual.control')
  handleManualControl(
    @Payload()
    data: {
      serial_number: string;
      relay_number: number;
      role: string;
      action: 'ON' | 'OFF';
    },
    @Ctx() context: RmqContext,
  ) {
    const topic = `device/${data.serial_number}/control/${data.relay_number}`;

    this.mqttClient.emit(topic, {
      action: data.action
    });

    console.log(`[Manual Control] Đã bắn lệnh xuống MQTT topic: ${topic}`);
    this.rmqService.ack(context);

    // TODO: Bắn Event sang logging-service để lưu lịch sử (FR-OPS-04)
  }

}
