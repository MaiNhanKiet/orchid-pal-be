import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, IS_PUBLIC_KEY } from '../decorators';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class PermissionRbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Kiểm tra nếu là route public thì bỏ qua
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Lấy các permissions yêu cầu từ metadata của route
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu không có permissions yêu cầu, cho phép truy cập
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Lấy thông tin user từ request, sau khi đã được xác thực bởi JWT Auth Guard
    const user = context.switchToHttp().getRequest().user;
    if (!user || !user.role) {
      throw new UnauthorizedException('Không có quyền truy cập');
    }

    // Lấy permissions của user từ DB
    const userPermissions = await this.rbacService.getPermissionsByUserId(
      user.id,
    );
    if (!userPermissions || userPermissions.length === 0) {
      throw new UnauthorizedException('Không có quyền truy cập');
    }

    // Kiểm tra user có permission phù hợp không
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
