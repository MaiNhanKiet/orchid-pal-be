import { Injectable } from '@nestjs/common';
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
}
