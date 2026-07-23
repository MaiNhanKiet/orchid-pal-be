import {
  ActivateDeviceCommandDto,
  AssignDeviceToPlantCommandDto,
  CreateDeviceDto,
  DEVICE_ERROR_CODES,
  ManualControlDeviceCommandDto,
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
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AutomationService } from '../automation/automation.service';

export type DeviceAssignedPlantEvent = {
  device_id: string;
  plant_id: string;
  user_id: string;
};

export type ManualControlEvent = {
  serial_number: string;
  relay_port: number;
  action: 'ON' | 'OFF';
  device_id: string;
  trigger_reason?: string;
};

@Injectable()
export class DeviceService implements OnModuleInit {
  private readonly logger = new Logger(DeviceService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('AUTOMATION') private readonly automationClient: ClientProxy,
    @Inject(forwardRef(() => AutomationService))
    private readonly automationService: AutomationService,
  ) {}

  async onModuleInit() {
    try {
      await this.automationClient.connect();
    } catch {
      /* retry on use */
    }
  }

  async activateDevice(data: ActivateDeviceCommandDto) {
    if (!data.device_id && !data.serial_number) {
      throw new BadRequestException('device_id hoặc serial_number là bắt buộc');
    }

    const device = data.device_id
      ? await this.prisma.devices.findUnique({ where: { id: data.device_id } })
      : await this.prisma.devices.findUnique({
          where: { serial_number: data.serial_number! },
        });
    if (!device) throw new NotFoundException('Thiết bị không tồn tại');
    if (device.owner_id) {
      throw new ConflictException({
        code: DEVICE_ERROR_CODES.KIT_ALREADY_ACTIVATED,
        message: 'Kit đã được kích hoạt. Không thể kích hoạt lại.',
      });
    }
    if (device.secret_key !== data.secret_key) {
      throw new BadRequestException('Secret key không đúng');
    }

    return this.prisma.devices.update({
      where: { id: device.id },
      data: {
        owner_id: data.user_id,
        status: 'OFFLINE',
        activated_at: new Date(),
      },
    });
  }

  async assignDeviceToPlant(data: AssignDeviceToPlantCommandDto) {
    const device = await this.prisma.devices.findUnique({
      where: { serial_number: data.serial_number },
    });
    if (!device) throw new NotFoundException('Thiết bị không tồn tại');
    if (device.owner_id !== data.user_id) {
      throw new ForbiddenException('Bạn không sở hữu thiết bị này');
    }

    const automationEvent: DeviceAssignedPlantEvent = {
      device_id: device.id,
      plant_id: data.plant_id,
      user_id: data.user_id,
    };

    if (device.plant_id) {
      if (device.plant_id === data.plant_id) {
        await this.pushAutomationConfig(automationEvent);
        return {
          message: 'Kit đã được gắn với cây này',
          device,
        };
      }
      throw new BadRequestException('Thiết bị đã gắn với cây khác');
    }

    const plant = await this.prisma.my_plants.findFirst({
      where: { id: data.plant_id, user_id: data.user_id },
      include: { devices: true },
    });
    if (!plant) throw new NotFoundException('Không tìm thấy cây');
    if (plant.devices && plant.devices.id !== device.id) {
      throw new BadRequestException('Cây này đã có Kit (tỷ lệ 1:1)');
    }

    const updated = await this.prisma.devices.update({
      where: { id: device.id },
      data: { plant_id: data.plant_id },
    });

    await this.pushAutomationConfig(automationEvent);

    return { message: 'Gắn Kit vào cây thành công', device: updated };
  }

  private async pushAutomationConfig(event: DeviceAssignedPlantEvent) {
    try {
      await this.automationService.handleDeviceAssignedPlant(event);
    } catch (error) {
      this.logger.error(
        `Failed to publish MQTT config for device ${event.device_id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException('Không thể gửi cấu hình xuống Kit qua MQTT');
    }
  }

  async listDevices(query: QueryDevicesDto) {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const where: Record<string, unknown> = {};
    if (query.search) {
      where.serial_number = { contains: query.search, mode: 'insensitive' };
    }
    if (query.status) where.status = query.status;
    if (query.owner_id) where.owner_id = query.owner_id;
    if (query.plant_id) where.plant_id = query.plant_id;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.devices.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          my_plants: {
            select: { id: true, nickname: true, species_name: true },
          },
          users: { select: { id: true, email: true, full_name: true } },
          device_relays: {
            select: {
              id: true,
              relay_port: true,
              name: true,
              current_state: true,
            },
            orderBy: { relay_port: 'asc' },
          },
        },
      }),
      this.prisma.devices.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getMyDevices(user_id: string, query: PaginationDto & { search?: string }) {
    const page = Number(query.page ?? DEFAULT_PAGE);
    const limit = Number(query.limit ?? DEFAULT_LIMIT);
    const where: Record<string, unknown> = { owner_id: user_id };
    if (query.search) {
      where.serial_number = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.devices.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          my_plants: { select: { id: true, nickname: true, species_name: true } },
          device_relays: true,
        },
      }),
      this.prisma.devices.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getLatestDevice(user_id: string) {
    const device = await this.prisma.devices.findFirst({
      where: { owner_id: user_id, plant_id: { not: null } },
      orderBy: { created_at: 'desc' },
      include: { my_plants: true, device_relays: true },
    });
    if (!device) throw new NotFoundException('Chưa có Kit nào được gắn cây');
    return device;
  }

  async getDeviceById(id: string) {
    const device = await this.prisma.devices.findUnique({ where: { id } });
    if (!device) throw new NotFoundException('Thiết bị không tồn tại');
    return device;
  }

  async getDeviceBySerial(serial_number: string) {
    const device = await this.prisma.devices.findUnique({ where: { serial_number } });
    if (!device) throw new NotFoundException('Thiết bị không tồn tại');
    return device;
  }

  async getDeviceBySerialPublic(serial_number: string) {
    const device = await this.prisma.devices.findUnique({
      where: { serial_number },
      select: { serial_number: true, status: true, last_online_at: true },
    });
    if (!device) throw new NotFoundException('Thiết bị không tồn tại');
    return device;
  }

  async getMyDeviceDetail(user_id: string, device_id: string) {
    const device = await this.prisma.devices.findFirst({
      where: { id: device_id, owner_id: user_id },
      include: {
        my_plants: {
          select: {
            id: true,
            nickname: true,
            species_name: true,
            ai_suggested_thresholds: true,
          },
        },
        device_relays: true,
        automation_rules: { orderBy: { created_at: 'desc' } },
      },
    });
    if (!device) throw new NotFoundException('Thiết bị không tồn tại');
    return device;
  }

  async changeDeviceStatusBySerial(serial_number: string, status: string) {
    const existing = await this.prisma.devices.findUnique({
      where: { serial_number },
      select: { id: true },
    });
    if (!existing) return;

    await this.prisma.devices.update({
      where: { serial_number },
      data: {
        status,
        last_online_at: status === 'ONLINE' ? new Date() : undefined,
      },
    });
  }

  async manualControlDevice(data: ManualControlDeviceCommandDto) {
    const device = await this.prisma.devices.findUnique({
      where: { serial_number: data.serial_number },
      include: { device_relays: true },
    });
    if (!device) throw new NotFoundException('Thiết bị không tồn tại');
    if (data.user_id && device.owner_id !== data.user_id) {
      throw new ForbiddenException('Bạn không sở hữu thiết bị này');
    }

    const relay =
      (typeof data.relay_port === 'number'
        ? device.device_relays.find((r) => r.relay_port === data.relay_port)
        : undefined) ??
      device.device_relays.find(
        (r) => (r.name ?? '').toUpperCase() === data.role.toUpperCase(),
      ) ??
      device.device_relays.find((r) => r.relay_port === 1) ??
      device.device_relays[0];

    if (!relay) {
      throw new BadRequestException('Relay chưa được cấu hình cho role này');
    }

    const payload: ManualControlEvent = {
      serial_number: data.serial_number,
      relay_port: relay.relay_port,
      action: data.action,
      device_id: device.id,
    };

    await this.automationService.handleManualControl(payload);

    await this.prisma.device_relays.update({
      where: { id: relay.id },
      data: { current_state: data.action === 'ON' },
    });

    return { message: 'Relay control command sent', payload };
  }

  async createDevice(data: CreateDeviceDto) {
    const exists = await this.prisma.devices.findUnique({
      where: { serial_number: data.serial_number },
    });
    if (exists) throw new BadRequestException('Serial number đã tồn tại');

    const device = await this.prisma.devices.create({
      data: {
        serial_number: data.serial_number,
        secret_key: data.secret_key,
      },
    });

    const defaultRelays = [{ relay_port: 1, name: 'PUMP' }];
    await this.prisma.device_relays.createMany({
      data: defaultRelays.map((r) => ({ ...r, device_id: device.id })),
    });

    return device;
  }

  async createDevicesBatch(secretKey: string, quantity: number, skuPrefix: string) {
    if (!secretKey) throw new BadRequestException('secret_key is required');
    if (!quantity || quantity <= 0) {
      throw new BadRequestException('quantity must be positive');
    }

    const latest = await this.prisma.devices.findFirst({
      where: { serial_number: { startsWith: skuPrefix } },
      orderBy: { serial_number: 'desc' },
    });

    let startIndex = 1;
    if (latest?.serial_number) {
      const parts = latest.serial_number.split('-');
      const parsed = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(parsed)) startIndex = parsed + 1;
    }

    const created = [];
    for (let i = 0; i < quantity; i++) {
      const index = startIndex + i;
      const serial = `${skuPrefix}-${String(index).padStart(3, '0')}`;
      created.push(await this.createDevice({ serial_number: serial, secret_key: secretKey }));
    }
    return { count: created.length, devices: created };
  }

  async updateDevice(data: UpdateDeviceDto) {
    await this.getDeviceById(data.id);
    return this.prisma.devices.update({
      where: { id: data.id },
      data: {
        status: data.status,
        current_firmware: data.current_firmware,
        qr_image_url: data.qr_image_url,
      },
    });
  }

  async deleteDevice(id: string) {
    await this.getDeviceById(id);
    await this.prisma.devices.delete({ where: { id } });
    return { message: 'Đã xóa thiết bị' };
  }

  async removeDeviceFromPlant(device_id: string, user_id: string) {
    const device = await this.prisma.devices.findFirst({
      where: { id: device_id, owner_id: user_id },
    });
    if (!device) throw new NotFoundException('Thiết bị không tồn tại');

    await this.prisma.$transaction([
      this.prisma.automation_rules.updateMany({
        where: { device_id, is_active: true },
        data: { is_active: false },
      }),
      this.prisma.devices.update({
        where: { id: device_id },
        data: { plant_id: null },
      }),
    ]);

    return { message: 'Đã gỡ Kit khỏi cây' };
  }

  async forceUnbindDevice(id: string) {
    await this.prisma.$transaction([
      this.prisma.automation_rules.updateMany({
        where: { device_id: id },
        data: { is_active: false },
      }),
      this.prisma.devices.update({
        where: { id },
        data: { owner_id: null, plant_id: null, status: 'INACTIVE', activated_at: null },
      }),
    ]);
    return { message: 'Đã force unbind thiết bị' };
  }

  async assignDeviceToUser(device_id: string, user_id: string) {
    const device = await this.prisma.devices.findUnique({ where: { id: device_id } });
    if (!device) throw new NotFoundException('Thiết bị không tồn tại');
    if (device.owner_id) {
      throw new BadRequestException('Thiết bị đã có chủ. Hãy force unbind trước khi gán lại.');
    }

    const user = await this.prisma.users.findUnique({ where: { id: user_id } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const updated = await this.prisma.devices.update({
      where: { id: device_id },
      data: {
        owner_id: user_id,
        status: 'OFFLINE',
        activated_at: new Date(),
      },
      include: {
        users: { select: { id: true, email: true, full_name: true } },
      },
    });

    return { message: 'Đã gán Kit cho người dùng', device: updated };
  }
}
