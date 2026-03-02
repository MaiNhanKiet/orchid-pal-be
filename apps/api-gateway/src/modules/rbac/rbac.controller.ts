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
import {
  CreateRoleDto,
  IdDto,
  MICROSERVICES_CLIENTS,
  Permissions,
  Public,
  UpdateRoleDto,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AssignPermissionsDto } from '@app/common/dtos/rbac/assign-role.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiGetRolesDocs,
  ApiCreateRoleDocs,
  ApiUpdateRoleDocs,
  ApiDeleteRoleDocs,
  ApiGetPermissionsDocs,
  ApiAssignPermissionsDocs,
} from './rbac.swagger';

@ApiTags('RBAC')
@ApiBearerAuth('access-token')
@Controller('rbac')
@Public()
export class RbacController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.IAM_SERVICE)
    private readonly iamClient: ClientProxy,
  ) { }

  @Get('roles')
  @Permissions(Permission.RoleView)
  @ApiGetRolesDocs()
  getRoles() {
    return firstValueFrom(this.iamClient.send({ cmd: 'get_roles' }, {}));
  }

  @Post('roles')
  @Permissions(Permission.RoleCreate)
  @ApiCreateRoleDocs()
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return firstValueFrom(
      this.iamClient.send({ cmd: 'create_role' }, createRoleDto),
    );
  }

  @Patch('roles/:id')
  @Permissions(Permission.RoleUpdate)
  @ApiUpdateRoleDocs()
  updateRole(@Param() idDto: IdDto, @Body() updateRoleDto: UpdateRoleDto) {
    return firstValueFrom(
      this.iamClient.send(
        { cmd: 'update_role' },
        { ...updateRoleDto, id: idDto.id },
      ),
    );
  }

  @Delete('roles/:id')
  @Permissions(Permission.RoleDelete)
  @ApiDeleteRoleDocs()
  deleteRole(@Param() idDto: IdDto) {
    return firstValueFrom(
      this.iamClient.send({ cmd: 'delete_role' }, { ...idDto }),
    );
  }

  @Get('permissions')
  @Permissions(Permission.RoleView)
  @ApiGetPermissionsDocs()
  getPermissions() {
    return firstValueFrom(
      this.iamClient.send({ cmd: 'get_permissions' }, {}),
    );
  }

  @Post('permissions')
  @Permissions(Permission.RoleUpdate)
  @ApiAssignPermissionsDocs()
  assignPermissionsToRole(@Body() assignPermissionsDto: AssignPermissionsDto) {
    return firstValueFrom(
      this.iamClient.send(
        { cmd: 'assign_permissions_to_role' },
        assignPermissionsDto,
      ),
    );
  }
}
