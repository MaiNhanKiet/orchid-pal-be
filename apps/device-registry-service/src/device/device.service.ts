import {
  ActivateDeviceCommandDto,
  AssignDeviceToZoneCommandDto,
  CreateDeviceDto,
  DeviceAssignedZoneEventDto,
  HardwareConfig,
  ManualControlDeviceCommandDto,
  ManualControlEventDto,
  MICROSERVICES_CLIENTS,
  PaginationDto,
  QueryDevicesDto,
  UpdateDeviceDto,
} from '@app/common';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/default.constant';
import { PrismaService } from '@app/prisma';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DeviceService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('AUTOMATION') private readonly automationClient: ClientProxy,
    @Inject(MICROSERVICES_CLIENTS.GARDEN_SERVICE)
    private readonly gardenClient: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.automationClient.connect();
    await this.gardenClient.connect();
  }

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

  async getLatestDevice(user_id: string) {
    const device = await this.prisma.devices.findFirst({
      where: {
        owner_id: user_id,
        zone_id: { not: null },
        planting_zones: {
          my_plants: {
            some: {},
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        planting_zones: {
          include: {
            my_plants: true,
          },
        },
      },
    });

    if (!device) {
      throw new NotFoundException(
        'Không tìm thấy thiết bị nào phù hợp (đã gán zone và có cây).',
      );
    }

    return {
      device: {
        id: device.id,
        serial_number: device.serial_number,
        status: device.status,
        last_online_at: device.last_online_at,
        created_at: device.created_at,
      },
      zone: {
        id: device.planting_zones.id,
        name: device.planting_zones.name,
        exposure: device.planting_zones.exposure,
        image_url: device.planting_zones.image_url,
      },
      plants: device.planting_zones.my_plants,
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
        status: true,
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

    if (device.status !== 'ONLINE') {
      throw new BadRequestException(
        'Thiết bị không trực tuyến. Vui lòng kiểm tra lại.',
      );
    }

    const plantCount = await firstValueFrom(
      this.gardenClient.send({ cmd: 'count_plants_in_zone' }, { zone_id }),
    );

    if (plantCount < 1) {
      throw new BadRequestException(
        'Khu vườn chưa có cây nào. Vui lòng thêm cây vào vườn trước khi gán thiết bị.',
      );
    }

    // Gửi sự kiện kích hoạt thiết bị lên RabbitMQ để Automation Service xử lý
    const payload: DeviceAssignedZoneEventDto = {
      device_id: device.id,
      zone_id: zone_id,
      user_id,
    };

    await firstValueFrom(
      this.automationClient.emit('device.assigned.zone', payload),
    );

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

  async getMyDevices(
    user_id: string,
    query: PaginationDto & { search?: string },
  ) {
    let { page, limit } = query;
    page = page ? Number(page) : DEFAULT_PAGE;
    limit = limit ? Number(limit) : DEFAULT_LIMIT;

    const where: any = {
      owner_id: user_id,
    };

    if (query.search) {
      where.serial_number = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.devices.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          products: {
            select: {
              name: true,
              image_url: true,
            },
          },
          planting_zones: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.devices.count({ where }),
    ]);

    return {
      data: data.map((device) => ({
        ...device,
        product_name: device.products?.name,
        product_image: device.products?.image_url,
        zone_name: device.planting_zones?.name,
      })),
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

  async getDeviceBySerial(serial_number: string) {
    const device = await this.prisma.devices.findUnique({
      where: { serial_number },
      select: {
        id: true,
        serial_number: true,
        status: true,
        last_online_at: true,
        hardware_config: true,
        owner_id: true,
        zone_id: true,
      },
    });

    if (!device) {
      throw new NotFoundException(
        'Thiết bị không tồn tại. Vui lòng kiểm tra lại serial number.',
      );
    }

    return device;
  }

  async getDeviceBySerialPublic(serial_number: string) {
    const device = await this.prisma.devices.findUnique({
      where: { serial_number },
      select: {
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

    return device;
  }

  async manualControlDevice(data: ManualControlDeviceCommandDto) {
    const device = await this.prisma.devices.findUnique({
      where: { serial_number: data.serial_number },
      select: {
        serial_number: true,
        hardware_config: true,
        zone_id: true,
      },
    });

    if (!device) {
      throw new NotFoundException(
        'Thiết bị không tồn tại. Vui lòng kiểm tra lại serial number.',
      );
    }

    const hardwareConfig = (device.hardware_config || {}) as HardwareConfig;
    const relays = hardwareConfig.relays || {};

    const relayEntries: Array<[number, string | null | undefined]> = [
      [1, relays.relay_1],
      [2, relays.relay_2],
      [3, relays.relay_3],
      [4, relays.relay_4],
    ];

    const relayNumber = relayEntries.find(
      ([, role]) => role === data.role,
    )?.[0];

    if (!relayNumber) {
      throw new BadRequestException(
        'Thiết bị chưa cấu hình relay cho role này.',
      );
    }

    const payload: ManualControlEventDto = {
      serial_number: data.serial_number,
      relay_number: relayNumber,
      role: data.role,
      action: data.action,
      zone_id: device.zone_id,
    };

    await this.automationClient.connect();
    this.automationClient.emit('send.manual.control', payload);

    return {
      message: 'Đã gửi lệnh điều khiển relay',
      payload,
    };
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

  async getMyDeviceDetail(user_id: string, device_id: string) {
    const device = await this.prisma.devices.findUnique({
      where: { id: device_id },
      include: {
        products: true,
        planting_zones: {
          include: {
            my_plants: true,
          },
        },
      },
    });

    if (!device) {
      throw new NotFoundException('Thiết bị không tồn tại');
    }

    if (device.owner_id !== user_id) {
      throw new ForbiddenException('Bạn không sở hữu thiết bị này');
    }

    return device;
  }
}
