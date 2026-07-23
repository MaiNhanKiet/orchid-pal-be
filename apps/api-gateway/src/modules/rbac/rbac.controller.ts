import {
  CreateRoleDto,
  IdDto,
  MICROSERVICES_CLIENTS,
  Permissions,
  UpdateRoleDto,
} from '@app/common';
import { GrpcRpcService } from '@app/grpc';
import { AssignPermissionsDto } from '@app/common/dtos/rbac/assign-role.dto';
import { Permission } from '@app/common/enums';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import {
  ApiAssignPermissionsDocs,
  ApiCreateRoleDocs,
  ApiDeleteRoleDocs,
  ApiGetPermissionsDocs,
  ApiGetRoleDocs,
  ApiGetRolesDocs,
  ApiUpdateRoleDocs,
} from './rbac.swagger';

@ApiTags('03 - RBAC')
@ApiBearerAuth('access-token')
@Controller('rbac')
export class RbacController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  @Get('roles')
  @Permissions(Permission.RoleView)
  @ApiGetRolesDocs()
  getRoles() {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.IDENTITY_SERVICE, 'get_roles', {});
  }

  @Get('roles/:id')
  @Permissions(Permission.RoleView)
  @ApiGetRoleDocs()
  getRole(@Param() idDto: IdDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.IDENTITY_SERVICE, 'get_role_with_permissions', { ...idDto });
  }

  @Post('roles')
  @Permissions(Permission.RoleCreate)
  @ApiCreateRoleDocs()
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.IDENTITY_SERVICE, 'create_role', createRoleDto);
  }

  @Patch('roles/:id')
  @Permissions(Permission.RoleUpdate)
  @ApiUpdateRoleDocs()
  updateRole(@Param() idDto: IdDto, @Body() updateRoleDto: UpdateRoleDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.IDENTITY_SERVICE, 'update_role', { ...updateRoleDto, id: idDto.id });
  }

  @Delete('roles/:id')
  @Permissions(Permission.RoleDelete)
  @ApiDeleteRoleDocs()
  deleteRole(@Param() idDto: IdDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.IDENTITY_SERVICE, 'delete_role', { ...idDto });
  }

  @Get('permissions')
  @Permissions(Permission.RoleView)
  @ApiGetPermissionsDocs()
  getPermissions() {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.IDENTITY_SERVICE, 'get_permissions', {});
  }

  @Post('permissions')
  @Permissions(Permission.RoleUpdate)
  @ApiAssignPermissionsDocs()
  assignPermissionsToRole(@Body() assignPermissionsDto: AssignPermissionsDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.IDENTITY_SERVICE, 'assign_permissions_to_role', assignPermissionsDto);
  }
}
