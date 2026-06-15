import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from '@app/common/constants/default.constant';
import { UpdateSpeciesWikiDto } from '@app/common/dtos/garden/species-wiki.dto';

@Injectable()
export class SpeciesService {
  constructor(private prisma: PrismaService) {}

  async getAllSpecies({ page, limit }: { page?: number; limit?: number }) {
    if (!page) page = DEFAULT_PAGE;
    if (!limit) limit = DEFAULT_LIMIT;

    const species = await this.prisma.plant_wiki.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        common_name: 'asc',
      },
    });

    const total = await this.prisma.plant_wiki.count();

    return {
      data: species,
      meta: {
        page,
        limit,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1,
      },
    };
  }

  async getSpeciesById(id: string) {
    const species = await this.prisma.plant_wiki.findUnique({
      where: { id },
    });

    if (!species) {
      throw new NotFoundException('Species not found');
    }

    return species;
  }

  async createSpecies(data: {
    common_name: string;
    scientific_name?: string;
    ideal_temp_min?: number;
    ideal_temp_max?: number;
    ideal_humid_min?: number;
    ideal_humid_max?: number;
    care_instruction?: string;
    image_url?: string;
    author_id: string;
  }) {
    const species = await this.prisma.plant_wiki.create({
      data,
    });

    return species;
  }

  async updateSpecies(id: string, data: UpdateSpeciesWikiDto) {
    const existing = await this.prisma.plant_wiki.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Species not found');
    }

    const species = await this.prisma.plant_wiki.update({
      where: { id },
      data,
    });

    return species;
  }

  async deleteSpecies(id: string) {
    const existing = await this.prisma.plant_wiki.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Species not found');
    }

    const species = await this.prisma.plant_wiki.delete({
      where: { id },
    });

    return species;
  }
}
