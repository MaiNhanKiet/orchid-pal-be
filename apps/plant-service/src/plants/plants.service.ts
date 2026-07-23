import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/default.constant';
import {
  CreatePlantCommandDto,
  UpdatePlantDto,
} from '@app/common/dtos/plant/plant.dto';
import { PrismaService } from '@app/prisma';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class PlantsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPlant(data: CreatePlantCommandDto) {
    const plant = await this.prisma.my_plants.create({
      data: {
        user_id: data.user_id,
        nickname: data.nickname,
        species_name: data.species_name,
        location_city: data.location_city,
        setup_image_url: data.setup_image_url,
        ai_space_analysis: data.ai_space_analysis,
        ai_suggested_thresholds: data.ai_suggested_thresholds,
        planted_at: data.planted_at ? new Date(data.planted_at) : new Date(),
      },
    });
    return { plant_id: plant.id, ...plant };
  }

  async updatePlant(id: string, userId: string, data: UpdatePlantDto) {
    const plant = await this.findOwnedPlant(id, userId);
    return this.prisma.my_plants.update({
      where: { id: plant.id },
      data: {
        nickname: data.nickname ?? undefined,
        species_name: data.species_name ?? undefined,
        location_city: data.location_city ?? undefined,
        setup_image_url: data.setup_image_url ?? undefined,
        ai_space_analysis: data.ai_space_analysis ?? undefined,
        ai_suggested_thresholds: data.ai_suggested_thresholds ?? undefined,
        updated_at: new Date(),
      },
    });
  }

  async getMyPlants(data: { user_id: string; page?: number; limit?: number }) {
    const page = data.page ?? DEFAULT_PAGE;
    const limit = data.limit ?? DEFAULT_LIMIT;

    const [plants, total] = await Promise.all([
      this.prisma.my_plants.findMany({
        where: { user_id: data.user_id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { devices: { select: { id: true, serial_number: true, status: true } } },
      }),
      this.prisma.my_plants.count({ where: { user_id: data.user_id } }),
    ]);

    return { plants, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPlantDetail(data: { user_id: string; plant_id: string }) {
    const plant = await this.prisma.my_plants.findFirst({
      where: { id: data.plant_id, user_id: data.user_id },
      include: {
        devices: {
          include: {
            device_relays: true,
            automation_rules: { where: { is_active: true } },
          },
        },
      },
    });
    if (!plant) throw new NotFoundException('Không tìm thấy cây');
    return plant;
  }

  async removePlant(plant_id: string, user_id: string) {
    const plant = await this.findOwnedPlant(plant_id, user_id);

    if (plant.devices) {
      throw new BadRequestException(
        'Không thể xóa cây đang gắn Kit. Hãy gỡ thiết bị trước.',
      );
    }

    await this.prisma.my_plants.delete({ where: { id: plant_id } });
    return { message: 'Đã xóa cây khỏi vườn' };
  }

  async applyAiAnalysis(plant_id: string, user_id: string, analysis: object, thresholds: object) {
    const plant = await this.findOwnedPlant(plant_id, user_id);
    return this.prisma.my_plants.update({
      where: { id: plant.id },
      data: {
        ai_space_analysis: analysis,
        ai_suggested_thresholds: thresholds,
        updated_at: new Date(),
      },
    });
  }

  private async findOwnedPlant(id: string, userId: string) {
    const plant = await this.prisma.my_plants.findUnique({
      where: { id },
      include: { devices: { select: { id: true } } },
    });
    if (!plant) throw new NotFoundException('Không tìm thấy cây');
    if (plant.user_id !== userId) throw new ForbiddenException('Bạn không sở hữu cây này');
    return plant;
  }
}
