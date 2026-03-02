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
} from '@app/common/dtos/device/device.dto';

@Controller()
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) { }

  @MessagePattern({ cmd: 'activate_device' })
  activateDevice(@Payload() data: ActivateDeviceCommandDto) {
    return this.deviceService.activateDevice(data);
  }

  @MessagePattern({ cmd: 'get_device_status' })
  getDeviceStatus(@Payload() data: GetDeviceStatusCommandDto) {
    return this.deviceService.getDeviceStatusBySerial(data.serial_number);
  }

  @MessagePattern({ cmd: 'assign_device_to_zone' })
  assignDeviceToZone(@Payload() data: AssignDeviceToZoneCommandDto) {
    return this.deviceService.assignDeviceToZone(data);
  }

  @EventPattern('device/+/status')
  async handleDeviceStatusUpdate(
    @Payload() _payload: unknown,
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

    await this.deviceService.markDeviceOnlineBySerial(serialNumber);
  }
}
