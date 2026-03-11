import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { CreateZoneCommandDto } from '@app/common/dtos/garden/zone.dto';

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
    });

    if (zones.length === 0) {
      throw new NotFoundException('Người dùng chưa có khu vườn nào');
    }

    return zones;
  }
}
