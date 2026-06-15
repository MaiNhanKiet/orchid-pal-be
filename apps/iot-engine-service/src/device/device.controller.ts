import { MqttStatusPayload } from '@app/common';
import {
  ActivateDeviceCommandDto,
  AssignDeviceToZoneCommandDto,
  CreateDeviceDto,
  GetDeviceStatusCommandDto,
  ManualControlDeviceCommandDto,
  QueryDevicesDto,
  UpdateDeviceDto,
} from '@app/common/dtos/device/device.dto';
import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  MqttContext,
  Payload,
} from '@nestjs/microservices';
import { DeviceService } from './device.service';

@Controller()
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) { }

  @GrpcCmd('activate_device')
  activateDevice(@Payload() data: ActivateDeviceCommandDto) {
    return this.deviceService.activateDevice(data);
  }

  @GrpcCmd('get_device_status')
  getDeviceStatus(@Payload() data: GetDeviceStatusCommandDto) {
    return this.deviceService.getDeviceBySerialPublic(data.serial_number);
  }

  @GrpcCmd('assign_device_to_zone')
  assignDeviceToZone(@Payload() data: AssignDeviceToZoneCommandDto) {
    return this.deviceService.assignDeviceToZone(data);
  }

  @GrpcCmd('list_devices')
  listDevices(@Payload() query: QueryDevicesDto) {
    return this.deviceService.listDevices(query);
  }

  @GrpcCmd('get_my_devices')
  getMyDevices(
    @Payload()
    data: {
      user_id: string;
      page?: number;
      limit?: number;
      search?: string;
    },
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

  @GrpcCmd('remove_device_from_garden')
  removeDeviceFromGarden(
    @Payload() data: { user_id: string; device_id: string },
  ) {
    return this.deviceService.removeDeviceFromGarden(data.device_id, data.user_id);
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

  @EventPattern('device/+/status')
  async handleDeviceStatusUpdate(
    @Payload() payload: MqttStatusPayload,
    @Ctx() context: MqttContext,
  ) {
    const topic = context.getTopic();
    const parts = topic.split('/');

    if (parts.length < 3) {
      return;
    }

    const serialNumber = parts[1];
    if (!serialNumber) {
      return;
    }

    await this.deviceService.changeDeviceStatusBySerial(
      serialNumber,
      payload.status,
    );
  }
}
