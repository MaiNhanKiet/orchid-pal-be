import { Controller, Get, Inject } from '@nestjs/common';
import { MICROSERVICES_CLIENTS, Permissions, Public } from '@app/common';
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
}
