import {
  AssignRoleDto,
  GoogleLoginDto,
  PaginationDto,
  UuidDto,
} from '@app/common';
import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @GrpcCmd('get_users')
  async getUsers(@Payload() paginationDto: PaginationDto) {
    const users = await this.usersService.findAll({
      ...paginationDto,
    });
    return users;
  }

  @GrpcCmd('ban_user')
  async banUser(@Payload() uuidDto: UuidDto) {
    const user = await this.usersService.banUser({ ...uuidDto });
    return user;
  }

  @GrpcCmd('assign_role')
  assignRole(@Payload() assignRoleDto: AssignRoleDto) {
    return this.usersService.assignRole({ ...assignRoleDto });
  }
}
