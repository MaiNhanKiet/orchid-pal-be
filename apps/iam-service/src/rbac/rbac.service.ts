import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma';

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
}
