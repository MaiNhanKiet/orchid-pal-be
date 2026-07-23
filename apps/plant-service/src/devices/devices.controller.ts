import { MqttStatusPayload } from '@app/common';
import {
  MQTT_DEVICE_SUBSCRIBE,
  extractSerialFromMqttTopic,
} from '@app/common/constants/mqtt-topics.constant';
import {
  ActivateDeviceCommandDto,
  AssignDeviceToPlantCommandDto,
  CreateDeviceDto,
  GetDeviceStatusCommandDto,
  ManualControlDeviceCommandDto,
  ProvisionDevicesDto,
  QueryDevicesDto,
  UpdateDeviceDto,
} from '@app/common/dtos/device/device.dto';
import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MqttContext,
  Payload,
} from '@nestjs/microservices';
import { DeviceService } from './devices.service';

@Controller()
export class DevicesController {
  constructor(private readonly deviceService: DeviceService) {}

  @GrpcCmd('activate_device')
  activateDevice(@Payload() data: ActivateDeviceCommandDto) {
    return this.deviceService.activateDevice(data);
  }

  @GrpcCmd('get_device_status')
  getDeviceStatus(@Payload() data: GetDeviceStatusCommandDto) {
    return this.deviceService.getDeviceBySerialPublic(data.serial_number);
  }

  @GrpcCmd('assign_device_to_plant')
  assignDeviceToPlant(@Payload() data: AssignDeviceToPlantCommandDto) {
    return this.deviceService.assignDeviceToPlant(data);
  }

  @GrpcCmd('list_devices')
  listDevices(@Payload() query: QueryDevicesDto) {
    return this.deviceService.listDevices(query);
  }

  @GrpcCmd('get_my_devices')
  getMyDevices(
    @Payload() data: { user_id: string; page?: number; limit?: number; search?: string },
  ) {
    return this.deviceService.getMyDevices(data.user_id, data);
  }

  @GrpcCmd('get_latest_device')
  getLatestDevice(@Payload() data: { user_id: string }) {
    return this.deviceService.getLatestDevice(data.user_id);
  }

  @GrpcCmd('get_device_by_id')
  getDeviceById(@Payload() id: string) {
    return this.deviceService.getDeviceById(id);
  }

  @GrpcCmd('get_my_device_detail')
  getMyDeviceDetail(@Payload() data: { user_id: string; device_id: string }) {
    return this.deviceService.getMyDeviceDetail(data.user_id, data.device_id);
  }

  @GrpcCmd('remove_device_from_plant')
  removeDeviceFromPlant(@Payload() data: { user_id: string; device_id: string }) {
    return this.deviceService.removeDeviceFromPlant(data.device_id, data.user_id);
  }

  @GrpcCmd('get_device_by_serial')
  getDeviceBySerial(@Payload() data: GetDeviceStatusCommandDto) {
    return this.deviceService.getDeviceBySerial(data.serial_number);
  }

  @GrpcCmd('manual_control_device')
  manualControlDevice(@Payload() data: ManualControlDeviceCommandDto) {
    return this.deviceService.manualControlDevice(data);
  }

  @GrpcCmd('create_device')
  createDevice(@Payload() data: CreateDeviceDto) {
    return this.deviceService.createDevice(data);
  }

  @GrpcCmd('provision_devices')
  provisionDevices(@Payload() data: ProvisionDevicesDto) {
    return this.deviceService.createDevicesBatch(
      data.secretKey,
      data.quantity,
      data.skuPrefix,
    );
  }

  @GrpcCmd('update_device')
  updateDevice(@Payload() data: UpdateDeviceDto) {
    return this.deviceService.updateDevice(data);
  }

  @GrpcCmd('delete_device')
  deleteDevice(@Payload() id: string) {
    return this.deviceService.deleteDevice(id);
  }

  @GrpcCmd('force_unbind_device')
  forceUnbindDevice(@Payload() id: string) {
    return this.deviceService.forceUnbindDevice(id);
  }

  @GrpcCmd('assign_device_to_user')
  assignDeviceToUser(
    @Payload() data: { device_id: string; user_id: string },
  ) {
    return this.deviceService.assignDeviceToUser(data.device_id, data.user_id);
  }

  @EventPattern(MQTT_DEVICE_SUBSCRIBE.status)
  async handleDeviceStatusUpdate(
    @Payload() payload: MqttStatusPayload,
    @Ctx() context: MqttContext,
  ) {
    const serialNumber = extractSerialFromMqttTopic(context.getTopic());
    if (!serialNumber) return;
    await this.deviceService.changeDeviceStatusBySerial(serialNumber, payload.status);
  }
}
