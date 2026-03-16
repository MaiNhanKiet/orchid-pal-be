import {
  DeviceActionLogEventDto,
  DeviceAssignedZoneEventDto,
  GetDeviceStatusCommandDto,
  ManualControlEventDto,
  MICROSERVICES_CLIENTS,
  RmqService,
  UpdateAutomationRulesDto,
} from '@app/common';
import { Controller, Inject } from '@nestjs/common';
import {
  ClientProxy,
  Ctx,
  EventPattern,
  MessagePattern,
  MqttContext,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AutomationServiceService } from './automation-service.service';

@Controller()
export class AutomationServiceController {
  constructor(
    private readonly automationServiceService: AutomationServiceService,
    private readonly rmqService: RmqService,
    @Inject(MICROSERVICES_CLIENTS.DEVICE_REGISTRY_SERVICE)
    private readonly deviceRegistryClient: ClientProxy,
  ) {}

  @EventPattern('device.assigned.zone')
  async handleDeviceAssigned(
    @Payload() data: DeviceAssignedZoneEventDto,
    @Ctx() context: RmqContext,
  ) {
    await this.automationServiceService.handleDeviceAssignedZone(data);
    this.rmqService.ack(context);
  }

  @EventPattern('send.manual.control')
  async handleManualControl(
    @Payload() data: ManualControlEventDto,
    @Ctx() context: RmqContext,
  ) {
    await this.automationServiceService.handleManualControl(data);
    this.rmqService.ack(context);
  }

  @MessagePattern({ cmd: 'update_automation_rules' })
  async updateAutomationRules(@Payload() data: UpdateAutomationRulesDto) {
    return this.automationServiceService.updateAutomationRules(data);
  }

  @EventPattern('device/+/action_log')
  async handleDeviceActionLog(
    @Payload() data: DeviceActionLogEventDto,
    @Ctx() context: MqttContext,
  ) {
    const topic = context.getTopic();
    const serialNumber = topic.split('/')[1];

    if (!serialNumber) return;

    const device = await firstValueFrom(
      this.deviceRegistryClient.send({ cmd: 'get_device_by_serial' }, {
        serial_number: serialNumber,
      } as GetDeviceStatusCommandDto),
    );

    await this.automationServiceService.logAction({
      zone_id: device.zone_id,
      device_id: serialNumber,
      action: `Tự động ${data.action} rơ-le ${data.relay_number} (${data.role})`,
      trigger_reason: data.trigger_reason,
      value: data.value,
    });
  }
}
