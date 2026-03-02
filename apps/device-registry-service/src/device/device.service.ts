import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import {
  ActivateDeviceCommandDto,
  AssignDeviceToZoneCommandDto,
} from '@app/common/dtos/device/device.dto';

@Injectable()
export class DeviceService {
  constructor(private prisma: PrismaService) { }

  async activateDevice(data: ActivateDeviceCommandDto) {
    const { serial_number, secret_key, user_id } = data;

    const device = await this.prisma.devices.findUnique({
      where: { serial_number },
    });

    if (!device) {
      throw new NotFoundException(
        'Thiết bị không tồn tại. Vui lòng kiểm tra lại serial number.',
      );
    }

    if (device.secret_key !== secret_key) {
      throw new BadRequestException(
        'Secret key không đúng. Vui lòng kiểm tra lại QR code.',
      );
    }

    if (device.owner_id) {
      throw new BadRequestException(
        'Thiết bị đã có chủ. Không thể kích hoạt lại.',
      );
    }

    const updatedDevice = await this.prisma.devices.update({
      where: { id: device.id },
      data: {
        owner_id: user_id,
        status: 'OFFLINE',
      },
    });

    return {
      message: 'Kích hoạt thiết bị thành công',
      device: {
        id: updatedDevice.id,
        serial_number: updatedDevice.serial_number,
        owner_id: updatedDevice.owner_id,
        status: updatedDevice.status,
      },
    };
  }

  async markDeviceOnlineBySerial(serial_number: string) {
    const existing = await this.prisma.devices.findUnique({
      where: { serial_number },
      select: { id: true },
    });

    if (!existing) {
      return;
    }

    await this.prisma.devices.update({
      where: { serial_number },
      data: {
        status: 'ONLINE',
        last_online_at: new Date(),
      },
    });
  }

  async getDeviceStatusBySerial(serial_number: string) {
    const device = await this.prisma.devices.findUnique({
      where: { serial_number },
      select: {
        id: true,
        serial_number: true,
        status: true,
        last_online_at: true,
      },
    });

    if (!device) {
      throw new NotFoundException(
        'Thiết bị không tồn tại. Vui lòng kiểm tra lại serial number.',
      );
    }

    return {
      serial_number: device.serial_number,
      status: device.status,
      last_online_at: device.last_online_at,
    };
  }

  async assignDeviceToZone(data: AssignDeviceToZoneCommandDto) {
    const { serial_number, zone_id, user_id } = data;

    const device = await this.prisma.devices.findUnique({
      where: { serial_number },
      select: {
        id: true,
        owner_id: true,
      },
    });

    if (!device) {
      throw new NotFoundException(
        'Thiết bị không tồn tại. Vui lòng kiểm tra lại serial number.',
      );
    }

    if (device.owner_id !== user_id) {
      throw new ForbiddenException(
        'Bạn không có quyền gán thiết bị này vào vườn.',
      );
    }

    const updated = await this.prisma.devices.update({
      where: { id: device.id },
      data: {
        zone_id,
      },
      select: {
        id: true,
        serial_number: true,
        owner_id: true,
        zone_id: true,
        status: true,
      },
    });

    return {
      message: 'Gán thiết bị vào vườn thành công',
      device: updated,
    };
  }
}
