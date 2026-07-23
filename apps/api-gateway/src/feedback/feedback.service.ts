import { PrismaService } from '@app/prisma';
import { Injectable } from '@nestjs/common';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async createFeedback(dto: CreateFeedbackDto) {
    return this.prisma.feedbacks.create({
      data: {
        category: dto.category,
        name: dto.name?.trim() || null,
        email: dto.email.trim().toLowerCase(),
        message: dto.message.trim(),
        source: dto.source?.trim() || 'landing',
        user_id: dto.user_id ?? null,
      },
      select: {
        id: true,
        category: true,
        created_at: true,
      },
    });
  }

  async listFeedback(params: {
    page?: number;
    limit?: number;
    category?: string;
  }) {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = params.category ? { category: params.category } : {};

    const [data, total] = await Promise.all([
      this.prisma.feedbacks.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          category: true,
          name: true,
          email: true,
          message: true,
          source: true,
          user_id: true,
          created_at: true,
        },
      }),
      this.prisma.feedbacks.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        last_page: Math.ceil(total / limit) || 1,
      },
    };
  }
}
