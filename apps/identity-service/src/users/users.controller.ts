import {
  AssignRoleDto,
  PaginationDto,
  RemoveRoleDto,
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
    return this.usersService.findAll({ ...paginationDto });
  }

  @GrpcCmd('ban_user')
  async banUser(@Payload() uuidDto: UuidDto) {
    return this.usersService.banUser({ ...uuidDto });
  }

  @GrpcCmd('unban_user')
  async unbanUser(@Payload() uuidDto: UuidDto) {
    return this.usersService.unbanUser({ ...uuidDto });
  }

  @GrpcCmd('assign_role')
  assignRole(@Payload() assignRoleDto: AssignRoleDto) {
    return this.usersService.assignRole({ ...assignRoleDto });
  }

  @GrpcCmd('remove_role')
  removeRole(@Payload() removeRoleDto: RemoveRoleDto) {
    return this.usersService.removeRole({ ...removeRoleDto });
  }

  @GrpcCmd('get_profile')
  getProfile(@Payload() payload: { userId: string }) {
    return this.usersService.getProfile({ userId: payload.userId });
  }

  @GrpcCmd('update_profile')
  updateProfile(
    @Payload()
    payload: {
      userId: string;
      full_name?: string;
      phone?: string;
      avatar_url?: string;
      preferences?: Record<string, unknown>;
    },
  ) {
    return this.usersService.updateProfile(payload);
  }
}
