import { Controller, Get, Inject, Query } from '@nestjs/common';
import {
  GoogleLoginDto,
  MICROSERVICES_CLIENTS,
  PaginationDto,
  Permissions,
  Public,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { ClientProxy } from '@nestjs/microservices';

@Controller('users')
@Public()
export class UsersController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.IAM_SERVICE)
    private readonly iamClient: ClientProxy,
  ) {}

  @Get()
  @Permissions(Permission.UserView)
  getUsers(@Query() paginationDto: PaginationDto) {
    console.log(paginationDto);
    return this.iamClient.send({ cmd: 'get_users' }, paginationDto);
  }
}
