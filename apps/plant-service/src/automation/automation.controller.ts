import { DeviceActionLogEventDto, RmqService, UpdateAutomationRulesDto } from '@app/common';
import { MQTT_DEVICE_SUBSCRIBE, extractSerialFromMqttTopic } from '@app/common/constants/mqtt-topics.constant';
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
import { DeviceService } from '../devices/devices.service';

@Controller()
export class AutomationController {
  constructor(
    private readonly automationService: AutomationService,
    private readonly rmqService: RmqService,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
  ) {}

  @EventPattern('device.assigned.plant')
  async handleDeviceAssigned(
    @Payload() data: { device_id: string; plant_id: string; user_id: string },
    @Ctx() context: RmqContext,
  ) {
    await this.automationService.handleDeviceAssignedPlant(data);
    this.rmqService.ack(context);
  }

  @EventPattern('send.manual.control')
  async handleManualControl(
    @Payload() data: { serial_number: string; relay_port: number; action: 'ON' | 'OFF'; device_id: string },
    @Ctx() context: RmqContext,
  ) {
    await this.automationService.handleManualControl(data);
    this.rmqService.ack(context);
  }

  @GrpcCmd('update_automation_rules')
  updateAutomationRules(@Payload() data: UpdateAutomationRulesDto) {
    return this.automationService.updateAutomationRules(data);
  }

  @GrpcCmd('refresh_automation_by_plant')
  refreshAutomationByPlant(@Payload() data: { plant_id: string; user_id: string }) {
    return this.automationService.refreshAutomationByPlant(data);
  }

  @GrpcCmd('delete_automation_rule')
  deleteAutomationRule(@Payload() data: { rule_id: string; user_id: string }) {
    return this.automationService.deleteAutomationRule(data);
  }

  @GrpcCmd('activate_automation_rule')
  activateAutomationRule(@Payload() data: { rule_id: string; user_id: string }) {
    return this.automationService.activateAutomationRule(data);
  }

  @GrpcCmd('get_device_logs')
  getDeviceLogs(@Payload() data: { device_id: string; page: number; limit: number }) {
    return this.automationService.getDeviceLogs(data.device_id, data.page, data.limit);
  }

  @GrpcCmd('get_my_device_logs')
  getMyDeviceLogs(
    @Payload() data: { serial_number: string; user_id: string; page: number; limit: number },
  ) {
    return this.automationService.getMyDeviceLogs(
      data.serial_number,
      data.user_id,
      data.page,
      data.limit,
    );
  }

  @EventPattern(MQTT_DEVICE_SUBSCRIBE.actionLog)
  async handleDeviceActionLog(
    @Payload() data: DeviceActionLogEventDto,
    @Ctx() context: MqttContext,
  ) {
    const serialNumber = extractSerialFromMqttTopic(context.getTopic());
    if (!serialNumber) return;

    const device = await this.deviceService.getDeviceBySerial(serialNumber);
    await this.automationService.logAction({
      plant_id: device.plant_id ?? 'unknown',
      device_id: serialNumber,
      action: `${data.role} ${data.action} relay ${data.relay_number}`,
      trigger_reason: data.trigger_reason,
      value: data.value,
    });
  }
}

