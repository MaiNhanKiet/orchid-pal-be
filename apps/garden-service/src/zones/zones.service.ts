import { Injectable } from '@nestjs/common';
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
}
