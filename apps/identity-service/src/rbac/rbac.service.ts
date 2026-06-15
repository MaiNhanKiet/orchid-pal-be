import { PrismaService } from '@app/prisma';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  findAllRoles() {
    return this.prisma.roles.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
  }

  async createRole({
    name,
    description,
  }: {
    name: string;
    description: string;
  }) {
    const roleName = name.toUpperCase();
    const roleExists = await this.prisma.roles.findUnique({
      where: { name: roleName },
    });

    if (roleExists) {
      throw new ConflictException('Role already exists');
    }

    return this.prisma.roles.create({
      data: {
        name: roleName,
        description,
      },
    });
  }

  async updateRole({
    id,
    name,
    description,
  }: {
    id: number;
    name?: string;
    description?: string;
  }) {
    if (!name && !description) {
      throw new BadRequestException(
        'At least one field (name or description) must be provided',
      );
    }

    if (id === 1) throw new BadRequestException('Cannot update System Role');

    if (name) {
      const existing = await this.prisma.roles.findUnique({ where: { name } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Role name already exists');
      }
    }

    return this.prisma.roles.update({
      where: { id },
      data: { name, description },
    });
  }

  async deleteRole({ id }: { id: number }) {
    if (id === 1) throw new BadRequestException('Cannot delete System Role');

    return this.prisma.roles.delete({
      where: { id },
    });
  }

  async getRoleWithPermissions(id: number) {
    const role = await this.prisma.roles.findUnique({
      where: { id },
      include: {
        role_permissions: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.role_permissions.map((rp) => rp.permissions),
    };
  }

  async findAllPermissions() {
    return this.prisma.permissions.findMany({
      orderBy: { slug: 'asc' },
      select: {
        id: true,
        slug: true,
        description: true,
      },
    });
  }

  async updatePermissionsToRole({
    roleId,
    permissionIds,
  }: {
    roleId: number;
    permissionIds: number[];
  }) {
    if (roleId === 1)
      throw new BadRequestException('Cannot change permissions of Super Admin');

    const role = await this.prisma.roles.findUnique({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    return this.prisma.$transaction(async (tx) => {
      // xóa quyền cũ
      await tx.role_permissions.deleteMany({
        where: { role_id: roleId },
      });

      // thêm quyền mới
      if (permissionIds.length > 0) {
        const validPermissions = await tx.permissions.findMany({
          where: { id: { in: permissionIds } },
          select: { id: true },
        });

        const dataToInsert = validPermissions.map((p) => ({
          role_id: roleId,
          permission_id: p.id,
        }));

        await tx.role_permissions.createMany({
          data: dataToInsert,
          skipDuplicates: true,
        });
      }

      return { message: 'Permissions updated successfully' };
    });
  }
}
