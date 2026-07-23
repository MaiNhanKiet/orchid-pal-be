import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtPayload } from '@app/common';
import { IS_PUBLIC_KEY } from '@app/common';
import { AUDIT_VIEWER_ROLES } from '../audit.types';

@Injectable()
export class AuditViewerGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as JwtPayload | undefined;
    const roles = Array.isArray(user?.role)
      ? user.role.map((r) => String(r).toUpperCase())
      : user?.role
        ? [String(user.role).toUpperCase()]
        : [];

    const allowed = roles.some((role) =>
      (AUDIT_VIEWER_ROLES as readonly string[]).includes(role),
    );

    if (!allowed) {
      throw new ForbiddenException('Bạn không có quyền xem Audit Log');
    }

    return true;
  }
}
