import { CreateZoneCommandDto } from '@app/common/dtos/garden/zone.dto';
import { PrismaService } from '@app/prisma';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

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
}
