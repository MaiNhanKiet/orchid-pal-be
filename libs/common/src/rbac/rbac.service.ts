import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  async getPermissionsByUserId(userId: string) {
    const permissions = await this.prisma.permissions.findMany({
      where: {
        active: true,
        role_permissions: {
          some: {
            roles: {
              users: {
                some: { id: userId },
              },
            },
          },
        },
      },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    });
    return permissions;
  }
}
