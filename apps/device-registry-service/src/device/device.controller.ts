import { Controller } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  MqttContext,
  Payload,
} from '@nestjs/microservices';
import { DeviceService } from './device.service';
import {
  ActivateDeviceCommandDto,
  GetDeviceStatusCommandDto,
  AssignDeviceToZoneCommandDto,
  CreateDeviceDto,
  UpdateDeviceDto,
  QueryDevicesDto,
  ManualControlDeviceCommandDto,
} from '@app/common/dtos/device/device.dto';
import { MqttStatusPayload } from '@app/common';

@Controller()
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) { }

  @MessagePattern({ cmd: 'activate_device' })
  activateDevice(@Payload() data: ActivateDeviceCommandDto) {
    return this.deviceService.activateDevice(data);
  }

  @MessagePattern({ cmd: 'get_device_status' })
  getDeviceStatus(@Payload() data: GetDeviceStatusCommandDto) {
    return this.deviceService.getDeviceBySerialPublic(data.serial_number);
  }

  @MessagePattern({ cmd: 'assign_device_to_zone' })
  assignDeviceToZone(@Payload() data: AssignDeviceToZoneCommandDto) {
    return this.deviceService.assignDeviceToZone(data);
  }

  @MessagePattern({ cmd: 'list_devices' })
  listDevices(@Payload() query: QueryDevicesDto) {
    return this.deviceService.listDevices(query);
  }

  @MessagePattern({ cmd: 'get_device_by_id' })
  getDeviceById(@Payload() id: string) {
    return this.deviceService.getDeviceById(id);
  }

  @MessagePattern({ cmd: 'get_device_by_serial' })
  getDeviceBySerial(@Payload() data: GetDeviceStatusCommandDto) {
    return this.deviceService.getDeviceBySerial(data.serial_number);
  }

  @MessagePattern({ cmd: 'manual_control_device' })
  manualControlDevice(@Payload() data: ManualControlDeviceCommandDto) {
    return this.deviceService.manualControlDevice(data);
  }

  @MessagePattern({ cmd: 'create_device' })
  createDevice(@Payload() data: CreateDeviceDto) {
    return this.deviceService.createDevice(data);
  }

  @MessagePattern({ cmd: 'update_device' })
  updateDevice(@Payload() data: UpdateDeviceDto) {
    return this.deviceService.updateDevice(data);
  }

  @MessagePattern({ cmd: 'delete_device' })
  deleteDevice(@Payload() id: string) {
    return this.deviceService.deleteDevice(id);
  }

  @MessagePattern({ cmd: 'force_unbind_device' })
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
