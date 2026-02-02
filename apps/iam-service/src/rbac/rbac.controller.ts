import { Controller } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateRoleDto, IdDto, UpdateRoleCommandDto } from '@app/common';

@Controller()
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @MessagePattern({ cmd: 'get_roles' })
  async getRoles() {
    const roles = await this.rbacService.findAllRoles();
    return roles;
  }

  @MessagePattern({ cmd: 'create_role' })
  async createRole(@Payload() createRoleDto: CreateRoleDto) {
    const role = await this.rbacService.createRole({ ...createRoleDto });
    return role;
  }

  @MessagePattern({ cmd: 'update_role' })
  updateRole(@Payload() updateRoleCommandDto: UpdateRoleCommandDto) {
    return this.rbacService.updateRole({ ...updateRoleCommandDto });
  }

  @MessagePattern({ cmd: 'delete_role' })
  deleteRole(@Payload() idDto: IdDto) {
    return this.rbacService.deleteRole({ ...idDto });
  }
}
