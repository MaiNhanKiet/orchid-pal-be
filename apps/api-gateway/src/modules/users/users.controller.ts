import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  AssignRoleDto,
  MICROSERVICES_CLIENTS,
  PaginationDto,
  Permissions,
  Public,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { ClientProxy } from '@nestjs/microservices';
import { UuidDto } from '@app/common/dtos/uuid.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiGetUsersDocs,
  ApiBanUserDocs,
  ApiAssignRoleDocs,
} from './user.swagger';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@Public()
export class UsersController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.IAM_SERVICE)
    private readonly iamClient: ClientProxy,
  ) {}

  @Get()
  @Permissions(Permission.UserView)
  @ApiGetUsersDocs()
  getUsers(@Query() paginationDto: PaginationDto) {
    return this.iamClient.send({ cmd: 'get_users' }, paginationDto);
  }

  @Patch(':id/ban')
  @Permissions(Permission.UserBlock)
  @ApiBanUserDocs()
  banUser(@Param() uuidDto: UuidDto) {
    return this.iamClient.send({ cmd: 'ban_user' }, { id: uuidDto.id });
  }

  @Post('assign-role')
  @Permissions(Permission.UserUpdate)
  @ApiAssignRoleDocs()
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.iamClient.send({ cmd: 'assign_role' }, assignRoleDto);
  }
}
