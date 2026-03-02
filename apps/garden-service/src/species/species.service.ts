import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import {
    DEFAULT_LIMIT,
    DEFAULT_PAGE,
} from '@app/common/constants/pagination.constant';

@Injectable()
export class SpeciesService {
    constructor(private prisma: PrismaService) { }

    async getAllSpecies({ page, limit }: { page?: number; limit?: number }) {
        if (!page) page = DEFAULT_PAGE;
        if (!limit) limit = DEFAULT_LIMIT;

        const species = await this.prisma.species_wiki.findMany({
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                common_name: 'asc',
            },
        });

        const total = await this.prisma.species_wiki.count();

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
        const species = await this.prisma.species_wiki.findUnique({
            where: { id },
        });

        if (!species) {
            throw new NotFoundException('Species not found');
        }

        return species;
    }
}
