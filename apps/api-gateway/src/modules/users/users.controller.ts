import {

  Body,

  Controller,

  Delete,

  Get,

  Param,

  Patch,

  Post,

  Query,

  BadRequestException,

} from '@nestjs/common';

import {

  AssignRoleDto,

  CurrentUser,

  JwtPayload,

  MICROSERVICES_CLIENTS,

  PaginationDto,

  Permissions,

  RemoveRoleDto,

} from '@app/common';

import { GrpcRpcService } from '@app/grpc';

import { Permission } from '@app/common/enums';

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

export class UsersController {

  constructor(private readonly grpcRpc: GrpcRpcService) {}



  @Get()

  @Permissions(Permission.UserView)

  @ApiGetUsersDocs()

  getUsers(@Query() paginationDto: PaginationDto) {

    return this.grpcRpc.send(

      MICROSERVICES_CLIENTS.IDENTITY_SERVICE,

      'get_users',

      paginationDto,

    );

  }



  @Patch(':id/ban')

  @Permissions(Permission.UserBlock)

  @ApiBanUserDocs()

  async banUser(

    @Param() uuidDto: UuidDto,

    @CurrentUser() actor: JwtPayload,

  ) {

    if (uuidDto.id === actor.sub) {

      throw new BadRequestException('You cannot ban your own account');

    }

    return this.grpcRpc.send(

      MICROSERVICES_CLIENTS.IDENTITY_SERVICE,

      'ban_user',

      { id: uuidDto.id },

    );

  }



  @Patch(':id/unban')

  @Permissions(Permission.UserBlock)

  async unbanUser(@Param() uuidDto: UuidDto) {

    return this.grpcRpc.send(

      MICROSERVICES_CLIENTS.IDENTITY_SERVICE,

      'unban_user',

      { id: uuidDto.id },

    );

  }



  @Post('assign-role')

  @Permissions(Permission.UserUpdate)

  @ApiAssignRoleDocs()

  assignRole(@Body() assignRoleDto: AssignRoleDto) {

    return this.grpcRpc.send(

      MICROSERVICES_CLIENTS.IDENTITY_SERVICE,

      'assign_role',

      assignRoleDto,

    );

  }



  @Delete('assign-role')

  @Permissions(Permission.UserUpdate)

  removeRole(@Body() removeRoleDto: RemoveRoleDto) {

    return this.grpcRpc.send(

      MICROSERVICES_CLIENTS.IDENTITY_SERVICE,

      'remove_role',

      removeRoleDto,

    );

  }

}


