import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from '../decorators';
import { Role } from '../enums/role.enum';
import { Permission } from '../enums/permission.enum';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RbacService } from '../rbac/rbac.service';

const AUDIT_VIEWER_ROLES = new Set<string>([
  Role.SuperAdmin,
  Role.SystemAdmin,
  Role.Auditor,
]);

function normalizeJwtRoles(role: JwtPayload['role'] | string | undefined): string[] {
  if (!role) return [];
  const list = Array.isArray(role) ? role : [role];
  return list
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim().toUpperCase().replace(/^ROLE_/, ''))
    .filter(Boolean);
}

@Injectable()
export class PermissionRbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user as JwtPayload | undefined;
    const roles = normalizeJwtRoles(user?.role);

    if (!user?.sub || roles.length === 0) {
      throw new UnauthorizedException('Không có quyền truy cập');
    }

    if (roles.includes(Role.SuperAdmin)) {
      return true;
    }

    const isAuditPermission = requiredPermissions.every((permission) =>
      [Permission.SysViewLogs, Permission.SysAccessDashboard].includes(
        permission as Permission,
      ),
    );
    if (
      isAuditPermission &&
      roles.some((role) => AUDIT_VIEWER_ROLES.has(role))
    ) {
      return true;
    }

    const userPermissions = await this.rbacService.getPermissionsByUserId(
      user.sub,
    );
    if (!userPermissions || userPermissions.length === 0) {
      throw new UnauthorizedException('Không có quyền truy cập');
    }

    const userPermissionSlugs = new Set(userPermissions.map((p) => p.slug));

    const hasPermission = requiredPermissions.some((permission) =>
      userPermissionSlugs.has(permission),
    );

    if (!hasPermission) {
      throw new UnauthorizedException('Không có quyền truy cập');
    }

    return true;
  }
}
