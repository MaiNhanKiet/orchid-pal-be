import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll({ page = 1, limit = 10 }: { page?: number; limit?: number }) {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.prisma.users.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          email: true,
          password_hash: true,
          full_name: true,
          phone: true,
          avatar_url: true,
          preferences: true,
          is_active: true,
        },
      }),
      this.prisma.users.count(),
    ]);

    return {
      data: records,
      meta: {
        total,
        page,
        limit,
        last_page: Math.ceil(total / limit),
      },
    };
  }
}
