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
import { AssignPermissionsDto } from '@app/common/dtos/rbac/assign-role.dto';

@Controller('rbac')
@Public()
export class RbacController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.IAM_SERVICE)
    private readonly iamClient: ClientProxy,
  ) {}

  @Get('roles')
  @Permissions(Permission.RoleView)
  getRoles() {
    return this.iamClient.send({ cmd: 'get_roles' }, {});
  }

  @Post('roles')
  @Permissions(Permission.RoleCreate)
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.iamClient.send({ cmd: 'create_role' }, createRoleDto);
  }

  @Patch('roles/:id')
  @Permissions(Permission.RoleUpdate)
  updateRole(@Param() idDto: IdDto, @Body() updateRoleDto: UpdateRoleDto) {
    return this.iamClient.send(
      { cmd: 'update_role' },
      { ...updateRoleDto, id: idDto.id },
    );
  }

  @Delete('roles/:id')
  @Permissions(Permission.RoleDelete)
  deleteRole(@Param() idDto: IdDto) {
    return this.iamClient.send({ cmd: 'delete_role' }, { ...idDto });
  }

  @Get('permissions')
  @Permissions(Permission.RoleView)
  getPermissions() {
    return this.iamClient.send({ cmd: 'get_permissions' }, {});
  }

  @Post('permissions')
  @Permissions(Permission.RoleUpdate)
  assignPermissionsToRole(@Body() assignPermissionsDto: AssignPermissionsDto) {
    return this.iamClient.send(
      { cmd: 'assign_permissions_to_role' },
      assignPermissionsDto,
    );
  }
}
