import { CreateZoneCommandDto } from '@app/common/dtos/garden/zone.dto';
import { PrismaService } from '@app/prisma';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) { }

  async createZone(data: CreateZoneCommandDto) {
    const zone = await this.prisma.planting_zones.create({
      data: {
        user_id: data.user_id,
        name: data.name,
        location_city: data.location_city,
        exposure: data.exposure,
        image_url: data.image_url,
      },
    });

    return {
      zone_id: zone.id,
      ...zone,
    };
  }

  async getZonesByUser(user_id: string) {
    const zones = await this.prisma.planting_zones.findMany({
      where: { user_id },
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: {
            my_plants: true,
            devices: true,
          },
        },
      },
    });

    if (zones.length === 0) {
      throw new NotFoundException('Người dùng chưa có khu vườn nào');
    }

    return zones.map((zone) => {
      const { _count, ...rest } = zone;
      return {
        ...rest,
        has_plant: _count.my_plants > 0,
        has_device: _count.devices > 0,
      };
    });
  }

  async getZoneDetail(zone_id: string, user_id: string) {
    const zone = await this.prisma.planting_zones.findFirst({
      where: { id: zone_id, user_id },
      include: {
        my_plants: {
          include: {
            species_wiki: true,
          },
        },
        devices: true,
        automation_rules: true,
      },
    });

    if (!zone) {
      throw new NotFoundException('Không tìm thấy khu vườn');
    }

    return zone;
  }

  async getZoneAutomationRules(zone_id: string, user_id: string) {
    const zone = await this.prisma.planting_zones.findFirst({
      where: { id: zone_id, user_id },
      include: {
        automation_rules: {
          where: { is_active: true },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!zone) {
      throw new NotFoundException('Không tìm thấy khu vườn');
    }

    return zone.automation_rules[0] || null;
  }

  async updateZone(
    zone_id: string,
    user_id: string,
    data: {
      name?: string;
      location_city?: string;
      exposure?: string;
      image_url?: string;
    },
  ) {
    const zone = await this.prisma.planting_zones.findFirst({
      where: { id: zone_id },
      select: { id: true, user_id: true },
    });

    if (!zone) {
      throw new NotFoundException('Không tìm thấy khu vườn');
    }

    if (zone.user_id !== user_id) {
      throw new ForbiddenException('Khu vườn không thuộc về bạn');
    }

    return this.prisma.planting_zones.update({
      where: { id: zone_id },
      data: {
        name: data.name ?? undefined,
        location_city: data.location_city ?? undefined,
        exposure: data.exposure ?? undefined,
        image_url: data.image_url ?? undefined,
      },
    });
  }

  async deleteZone(zone_id: string, user_id: string) {
    const zone = await this.prisma.planting_zones.findFirst({
      where: { id: zone_id },
      select: { id: true, user_id: true },
    });

    if (!zone) {
      throw new NotFoundException('Không tìm thấy khu vườn');
    }

    if (zone.user_id !== user_id) {
      throw new ForbiddenException('Khu vườn không thuộc về bạn');
    }

    const [plantCount, deviceCount] = await Promise.all([
      this.prisma.my_plants.count({ where: { zone_id } }),
      this.prisma.devices.count({ where: { zone_id } }),
    ]);

    if (plantCount > 0 || deviceCount > 0) {
      throw new BadRequestException(
        'Không thể xóa khu vườn khi vẫn còn cây hoặc thiết bị trong khu.',
      );
    }

    await this.prisma.planting_zones.delete({
      where: { id: zone_id },
    });

    return { message: 'Xóa khu vườn thành công' };
  }

  async getZoneCurrentPlantForRule(zone_id: string, user_id: string) {
    const zone = await this.prisma.planting_zones.findFirst({
      where: { id: zone_id, user_id },
      include: {
        my_plants: {
          orderBy: { created_at: 'desc' },
          take: 1,
          include: {
            species_wiki: true,
          },
        },
      },
    });

    if (!zone) {
      throw new NotFoundException('Không tìm thấy khu vườn');
    }

    const plant = zone.my_plants[0];

    if (!plant) {
      throw new BadRequestException('Khu vườn chưa có cây để cập nhật automation rule.');
    }

    if (!plant.species_wiki) {
      throw new BadRequestException('Cây trong khu vườn chưa có thông tin loài hợp lệ.');
    }

    return {
      zone_id: zone.id,
      plant_id: plant.id,
      species_id: plant.species_id,
      species_common_name: plant.species_wiki.common_name,
    };
  }
}
