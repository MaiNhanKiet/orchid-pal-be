import {
  DeviceActionLogEventDto,
  DeviceAssignedZoneEventDto,
  ManualControlEventDto,
  RefreshAutomationRulesByZoneDto,
  RmqService,
  UpdateAutomationRulesDto,
} from '@app/common';
import { GrpcCmd } from '@app/grpc';
import { Controller, Inject, forwardRef } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MqttContext,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { AutomationService } from './automation.service';
import { DeviceService } from '../device/device.service';

@Controller()
export class AutomationController {
  constructor(
    private readonly automationService: AutomationService,
    private readonly rmqService: RmqService,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
  ) {}

  @EventPattern('device.assigned.zone')
  async handleDeviceAssigned(
    @Payload() data: DeviceAssignedZoneEventDto,
    @Ctx() context: RmqContext,
  ) {
    await this.automationService.handleDeviceAssignedZone(data);
    this.rmqService.ack(context);
  }

  @EventPattern('send.manual.control')
  async handleManualControl(
    @Payload() data: ManualControlEventDto,
    @Ctx() context: RmqContext,
  ) {
    await this.automationService.handleManualControl(data);
    this.rmqService.ack(context);
  }

  @GrpcCmd('update_automation_rules')
  async updateAutomationRules(@Payload() data: UpdateAutomationRulesDto) {
    return this.automationService.updateAutomationRules(data);
  }

  @GrpcCmd('refresh_automation_rules_by_zone')
  async refreshAutomationRulesByZone(
    @Payload() data: RefreshAutomationRulesByZoneDto,
  ) {
    return this.automationService.refreshAutomationRulesByZone(data);
  }

  @EventPattern('device/+/action_log')
  async handleDeviceActionLog(
    @Payload() data: DeviceActionLogEventDto,
    @Ctx() context: MqttContext,
  ) {
    const topic = context.getTopic();
    const serialNumber = topic.split('/')[1];

    if (!serialNumber) return;

    const device = await this.deviceService.getDeviceBySerial(serialNumber);

    await this.automationService.logAction({
      zone_id: device.zone_id,
      device_id: serialNumber,
      action: `Tự động ${data.action} rơ-le ${data.relay_number} (${data.role})`,
      trigger_reason: data.trigger_reason,
      value: data.value,
    });
  }

  @GrpcCmd('get_device_logs')
  async getDeviceLogs(
    @Payload() data: { device_id: string; page: number; limit: number },
    @Ctx() context: RmqContext,
  ) {
    this.rmqService.ack(context);
    return this.automationService.getDeviceLogs(
      data.device_id,
      data.page,
      data.limit,
    );
  }
}
