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
import { GrpcRpcService } from '@app/grpc';
import { Permission } from '@app/common/enums';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { UuidDto } from '@app/common/dtos/uuid.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiGetUsersDocs,
  ApiBanUserDocs,
  ApiAssignRoleDocs,
} from './user.swagger';

@ApiTags('02 - Users')
@ApiBearerAuth('access-token')
@Controller('users')
@Public()
export class UsersController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  @Get()
  @Permissions(Permission.UserView)
  @ApiGetUsersDocs()
  getUsers(@Query() paginationDto: PaginationDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.IDENTITY_SERVICE, 'get_users', paginationDto);
  }

  @Patch(':id/ban')
  @Permissions(Permission.UserBlock)
  @ApiBanUserDocs()
  banUser(@Param() uuidDto: UuidDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.IDENTITY_SERVICE, 'ban_user', { id: uuidDto.id });
  }

  @Post('assign-role')
  @Permissions(Permission.UserUpdate)
  @ApiAssignRoleDocs()
  assignRole(@Body() assignRoleDto: AssignRoleDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.IDENTITY_SERVICE, 'assign_role', assignRoleDto);
  }
}
