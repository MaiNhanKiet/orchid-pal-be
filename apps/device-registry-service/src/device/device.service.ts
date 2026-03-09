import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import {
  ActivateDeviceCommandDto,
  AssignDeviceToZoneCommandDto,
  CreateDeviceDto,
  UpdateDeviceDto,
  QueryDevicesDto,
} from '@app/common/dtos/device/device.dto';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/pagination.constant';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class DeviceService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('AUTOMATION') private readonly rmqClient: ClientProxy,
  ) {}

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
    if (device.owner_id) {
      throw new BadRequestException(
        'Thiết bị đã có chủ. Không thể kích hoạt lại.',
      );
    }

    if (device.secret_key !== secret_key) {
      throw new BadRequestException(
        'Secret key không đúng. Vui lòng kiểm tra lại QR code.',
      );
    }

    const updatedDevice = await this.prisma.devices.update({
      where: { id: device.id },
      data: {
        owner_id: user_id,
        status: 'OFFLINE',
      },
    });

    this.rmqClient.emit('device.assigned.zone', {
      device_id: updatedDevice.id,
      zone_id: updatedDevice.zone_id,
      user_id: updatedDevice.owner_id,
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

  async changeDeviceStatusBySerial(serial_number: string, status: string) {
    const existing = await this.prisma.devices.findUnique({
      where: { serial_number },
      select: { id: true },
    });

    if (!existing) {
      console.log(
        `[${serial_number}] Thiết bị không tồn tại. Vui lòng kiểm tra lại serial number.`,
      );
      return;
    }

    await this.prisma.devices.update({
      where: { serial_number },
      data: {
        status,
        last_online_at: status === 'ONLINE' ? new Date() : null,
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
      device: 'updated',
    };
  }

  // CRUD cho device phục vụ màn hình quản trị
  async listDevices(query: QueryDevicesDto) {
    let { page, limit } = query;
    if (!page) page = DEFAULT_PAGE;
    if (!limit) limit = DEFAULT_LIMIT;

    const where: any = {};

    if (query.search) {
      where.serial_number = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.owner_id) {
      where.owner_id = query.owner_id;
    }

    if (query.zone_id) {
      where.zone_id = query.zone_id;
    }

    if (query.product_id) {
      where.product_id = query.product_id;
    }

    const sortBy = query.sortBy || 'created_at';
    const sortOrder = query.sortOrder || 'desc';

    const [data, total] = await this.prisma.$transaction([
      this.prisma.devices.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.devices.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
    };
  }

  async getDeviceById(id: string) {
    const device = await this.prisma.devices.findUnique({
      where: { id },
    });

    if (!device) {
      throw new NotFoundException('Thiết bị không tồn tại');
    }

    return device;
  }

  async createDevice(data: CreateDeviceDto) {
    const exists = await this.prisma.devices.findUnique({
      where: { serial_number: data.serial_number },
      select: { id: true },
    });

    if (exists) {
      throw new BadRequestException('Serial number đã tồn tại');
    }

    const device = await this.prisma.devices.create({
      data: {
        serial_number: data.serial_number,
        secret_key: data.secret_key,
        product_id: data.product_id,
      },
    });

    return device;
  }

  async updateDevice(data: UpdateDeviceDto) {
    const { id, ...fields } = data;

    const existing = await this.prisma.devices.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Thiết bị không tồn tại');
    }

    if (fields.serial_number) {
      const conflict = await this.prisma.devices.findUnique({
        where: { serial_number: fields.serial_number },
        select: { id: true },
      });

      if (conflict && conflict.id !== id) {
        throw new BadRequestException('Serial number đã được sử dụng');
      }
    }

    const device = await this.prisma.devices.update({
      where: { id },
      data: fields,
    });

    return device;
  }

  async deleteDevice(id: string) {
    const existing = await this.prisma.devices.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Thiết bị không tồn tại');
    }

    const device = await this.prisma.devices.delete({
      where: { id },
    });

    return device;
  }

  async forceUnbindDevice(id: string) {
    const existing = await this.prisma.devices.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Thiết bị không tồn tại');
    }

    const device = await this.prisma.devices.update({
      where: { id },
      data: {
        owner_id: null,
        zone_id: null,
        linked_master_id: null,
        status: 'INACTIVE',
      },
    });

    return device;
  }
}
