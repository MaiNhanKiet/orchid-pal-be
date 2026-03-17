import { CreateRoleDto, IdDto, UpdateRoleCommandDto } from '@app/common';
import { AssignPermissionsDto } from '@app/common/dtos/rbac/assign-role.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RbacService } from './rbac.service';

@Controller()
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @MessagePattern({ cmd: 'get_roles' })
  getRoles() {
    return this.rbacService.findAllRoles();
  }

  @MessagePattern({ cmd: 'create_role' })
  createRole(@Payload() createRoleDto: CreateRoleDto) {
    return this.rbacService.createRole({ ...createRoleDto });
  }

  @MessagePattern({ cmd: 'update_role' })
  updateRole(@Payload() updateRoleCommandDto: UpdateRoleCommandDto) {
    return this.rbacService.updateRole({ ...updateRoleCommandDto });
  }

  @MessagePattern({ cmd: 'delete_role' })
  deleteRole(@Payload() idDto: IdDto) {
    return this.rbacService.deleteRole({ ...idDto });
  }

  @MessagePattern({ cmd: 'get_role_with_permissions' })
  getRoleWithPermissions(@Payload() idDto: IdDto) {
    return this.rbacService.getRoleWithPermissions(idDto.id);
  }

  @MessagePattern({ cmd: 'get_permissions' })
  getPermissions() {
    return this.rbacService.findAllPermissions();
  }

  @MessagePattern({ cmd: 'assign_permissions_to_role' })
  assignPermissionsToRole(
    @Payload() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rbacService.updatePermissionsToRole({
      ...assignPermissionsDto,
    });
  }
}
