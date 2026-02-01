import { Controller, Get, Inject } from '@nestjs/common';
import { MICROSERVICES_CLIENTS, Permissions } from '@app/common';
import { Permission } from '@app/common/enums';
import { ClientProxy } from '@nestjs/microservices';

@Controller('rbac')
export class RbacController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.IAM_SERVICE)
    private readonly iamClient: ClientProxy,
  ) {}

  @Get('users')
  getUsers() {
    return { message: 'This is a protected user profile route.' };
  }
}
