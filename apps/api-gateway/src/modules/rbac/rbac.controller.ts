import {
  Body,
  Controller,
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
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.iamClient.send({ cmd: 'create_role' }, createRoleDto);
  }

  @Patch('roles/:id')
  updateRole(@Param() idDto: IdDto, @Body() updateRoleDto: UpdateRoleDto) {
    return this.iamClient.send(
      { cmd: 'update_role' },
      { ...updateRoleDto, id: idDto.id },
    );
  }
}
