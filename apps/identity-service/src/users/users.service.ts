import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
          full_name: true,
          phone: true,
          avatar_url: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          user_roles: {
            select: {
              role_id: true,
              roles: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      this.prisma.users.count(),
    ]);

    return {
      data: records.map((user) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
        roles: user.user_roles.map((item) => ({
          id: item.roles.id,
          name: item.roles.name,
        })),
      })),
      meta: {
        total,
        page,
        limit,
        last_page: Math.ceil(total / limit) || 1,
      },
    };
  }

  async banUser({ id }: { id: string }) {
    return this.prisma.users.update({
      where: { id },
      data: { is_active: false, updated_at: new Date() },
      select: { id: true, email: true, is_active: true },
    });
  }

  async unbanUser({ id }: { id: string }) {
    return this.prisma.users.update({
      where: { id },
      data: { is_active: true, updated_at: new Date() },
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

  async removeRole({ userId, roleId }: { userId: string; roleId: number }) {
    const link = await this.prisma.user_roles.findUnique({
      where: {
        user_id_role_id: { user_id: userId, role_id: roleId },
      },
    });

    if (!link) throw new NotFoundException('User does not have this role');

    const roleCount = await this.prisma.user_roles.count({
      where: { user_id: userId },
    });

    if (roleCount <= 1) {
      throw new BadRequestException('User must keep at least one role');
    }

    await this.prisma.user_roles.delete({
      where: {
        user_id_role_id: { user_id: userId, role_id: roleId },
      },
    });

    return { success: true };
  }

  private profileSelect = {
    id: true,
    email: true,
    full_name: true,
    phone: true,
    avatar_url: true,
    preferences: true,
    is_active: true,
    created_at: true,
    updated_at: true,
    user_roles: {
      select: {
        roles: {
          select: { name: true },
        },
      },
    },
  } as const;

  private mapProfile(user: {
    id: string;
    email: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
    preferences: unknown;
    is_active: boolean | null;
    created_at: Date | null;
    updated_at: Date | null;
    user_roles: { roles: { name: string } }[];
  }) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      avatar_url: user.avatar_url,
      preferences: user.preferences ?? {},
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
      roles: user.user_roles.map((item) => item.roles.name),
    };
  }

  async getProfile({ userId }: { userId: string }) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: this.profileSelect,
    });

    if (!user) throw new NotFoundException('User not found');

    return this.mapProfile(user);
  }

  async updateProfile({
    userId,
    full_name,
    phone,
    avatar_url,
    preferences,
  }: {
    userId: string;
    full_name?: string;
    phone?: string;
    avatar_url?: string;
    preferences?: Record<string, unknown>;
  }) {
    const existing = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundException('User not found');

    const user = await this.prisma.users.update({
      where: { id: userId },
      data: {
        ...(full_name !== undefined ? { full_name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(avatar_url !== undefined ? { avatar_url } : {}),
        ...(preferences !== undefined
          ? { preferences: preferences as Prisma.InputJsonValue }
          : {}),
        updated_at: new Date(),
      },
      select: this.profileSelect,
    });

    return this.mapProfile(user);
  }
}
