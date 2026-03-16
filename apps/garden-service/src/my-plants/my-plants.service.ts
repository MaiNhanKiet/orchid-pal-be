import {
  AssignPlantToZoneCommandDto,
  CreateMyPlantCommandDto,
} from '@app/common/dtos/garden/my-plant.dto';
import { PrismaService } from '@app/prisma';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class MyPlantsService {
  constructor(private prisma: PrismaService) {}

  async createMyPlant(data: CreateMyPlantCommandDto) {
    const species = await this.prisma.species_wiki.findUnique({
      where: { id: data.species_id },
      select: { id: true },
    });

    if (!species) {
      throw new NotFoundException('Không tìm thấy loài cây');
    }

    const plantedAt =
      data.planted_at != null ? new Date(data.planted_at) : new Date();

    const myPlant = await this.prisma.my_plants.create({
      data: {
        user_id: data.user_id,
        // zone_id: data.zone_id,
        species_id: data.species_id,
        nickname: data.nickname,
        image_url: data.image_url,
        planted_at: plantedAt,
      },
    });

    return {
      plant_id: myPlant.id,
      ...myPlant,
    };
  }

  async assignPlantToZone(data: AssignPlantToZoneCommandDto) {
    const { plant_id, zone_id, user_id } = data;

    const plant = await this.prisma.my_plants.findUnique({
      where: { id: plant_id },
    });

    if (!plant) {
      throw new NotFoundException('Không tìm thấy cây.');
    }

    if (plant.user_id !== user_id) {
      throw new ForbiddenException('Bạn không sở hữu cây này.');
    }

    if (plant.zone_id) {
      throw new BadRequestException('Cây này đã được gán vào khu vườn.');
    }

    const zone = await this.prisma.planting_zones.findUnique({
      where: { id: zone_id },
    });

    if (!zone) {
      throw new NotFoundException('Không tìm thấy khu vườn.');
    }

    if (zone.user_id !== user_id) {
      throw new ForbiddenException('Bạn không sở hữu khu vườn này.');
    }

    const existingPlantCount = await this.prisma.my_plants.count({
      where: { zone_id },
    });

    if (existingPlantCount >= 1) {
      throw new BadRequestException(
        'Khu vườn đã có cây. Vui lòng chọn khu vườn khác hoặc tạo mới.',
      );
    }

    const updated = await this.prisma.my_plants.update({
      where: { id: plant_id },
      data: { zone_id },
    });

    return updated;
  }

  async getPlantsByZone(zone_id: string) {
    const plants = await this.prisma.my_plants.findMany({
      where: { zone_id },
      select: {
        id: true,
        species_id: true,
        nickname: true,
        health_status: true,
      },
    });
    return plants;
  }

  async getMyPlants(data: { user_id: string; page?: number; limit?: number }) {
    const { user_id, page = 1, limit = 10 } = data;
    const skip = (page - 1) * limit;

    const [plants, total] = await Promise.all([
      this.prisma.my_plants.findMany({
        where: { user_id },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          species_wiki: true,
          planting_zones: true,
        },
      }),
      this.prisma.my_plants.count({ where: { user_id } }),
    ]);

    return {
      plants,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMyPlantDetail(data: { user_id: string; plant_id: string }) {
    const plant = await this.prisma.my_plants.findFirst({
      where: { id: data.plant_id, user_id: data.user_id },
      include: {
        species_wiki: true,
        planting_zones: true,
      },
    });

    if (!plant) {
      throw new NotFoundException('Không tìm thấy cây');
    }
    return plant;
  }

  async countPlantsInZone(zone_id: string) {
    return this.prisma.my_plants.count({ where: { zone_id } });
  }
}
