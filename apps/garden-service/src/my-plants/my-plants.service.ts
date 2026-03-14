import { CreateMyPlantCommandDto } from '@app/common/dtos/garden/my-plant.dto';
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
    const zone = await this.prisma.planting_zones.findUnique({
      where: { id: data.zone_id },
      select: { id: true, user_id: true },
    });

    if (!zone) {
      throw new NotFoundException('Không tìm thấy khu vườn');
    }

    if (zone.user_id !== data.user_id) {
      throw new ForbiddenException(
        'Bạn không có quyền trồng cây trong khu vườn này.',
      );
    }

    const existingPlantCount = await this.prisma.my_plants.count({
      where: { zone_id: data.zone_id },
    });

    if (existingPlantCount >= 1) {
      throw new BadRequestException(
        'Mỗi bộ thiết bị OrchidPal chỉ hỗ trợ theo dõi 1 cây duy nhất. Vui lòng tạo khu vực mới cho cây khác.',
      );
    }

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
        zone_id: data.zone_id,
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
}
