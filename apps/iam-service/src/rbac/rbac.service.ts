import { ConflictException, Injectable } from '@nestjs/common';
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
}
