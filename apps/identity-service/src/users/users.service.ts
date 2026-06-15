import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async banUser({ id }: { id: string }) {
    return this.prisma.users.update({
      where: { id },
      data: { is_active: false },
      select: { id: true, email: true, is_active: true },
    });
  }

  async assignRole({ userId, roleId }: { userId: string; roleId: number }) {
    const [user, role] = await Promise.all([
      this.prisma.users.findUnique({ where: { id: userId } }),
      this.prisma.roles.findUnique({ where: { id: roleId } }),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!role) throw new NotFoundException('Role not found');

    const existingLink = await this.prisma.user_roles.findUnique({
      where: {
        user_id_role_id: { user_id: userId, role_id: roleId },
      },
    });

    if (existingLink) throw new ConflictException('User already has this role');

    return this.prisma.user_roles.create({
      data: {
        user_id: userId,
        role_id: roleId,
      },
    });
  }
}
