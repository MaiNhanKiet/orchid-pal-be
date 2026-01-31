import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';

@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  async getPermissionsByUserId(userId: string) {
    const userRoles = await this.prisma.user_roles.findMany({
      where: {
        user_id: userId,
      },
      select: {
        roles: {
          select: {
            role_permissions: {
              select: {
                permissions: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const permissions = userRoles
      .flatMap((ur) => ur.roles.role_permissions)
      .map((rp) => rp.permissions)
      .filter((p) => p !== null);

    return permissions;
  }
}
