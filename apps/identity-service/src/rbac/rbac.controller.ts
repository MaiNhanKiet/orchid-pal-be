import { CreateRoleDto, IdDto, UpdateRoleCommandDto } from '@app/common';
import { AssignPermissionsDto } from '@app/common/dtos/rbac/assign-role.dto';
import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { RbacService } from './rbac.service';

@Controller()
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @GrpcCmd('get_roles')
  getRoles() {
    return this.rbacService.findAllRoles();
  }

  @GrpcCmd('create_role')
  createRole(@Payload() createRoleDto: CreateRoleDto) {
    return this.rbacService.createRole({ ...createRoleDto });
  }

  @GrpcCmd('update_role')
  updateRole(@Payload() updateRoleCommandDto: UpdateRoleCommandDto) {
    return this.rbacService.updateRole({ ...updateRoleCommandDto });
  }

  @GrpcCmd('delete_role')
  deleteRole(@Payload() idDto: IdDto) {
    return this.rbacService.deleteRole({ ...idDto });
  }

  @GrpcCmd('get_role_with_permissions')
  getRoleWithPermissions(@Payload() idDto: IdDto) {
    return this.rbacService.getRoleWithPermissions(idDto.id);
  }

  @GrpcCmd('get_permissions')
  getPermissions() {
    return this.rbacService.findAllPermissions();
  }

  @GrpcCmd('assign_permissions_to_role')
  assignPermissionsToRole(
    @Payload() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.rbacService.updatePermissionsToRole({
      ...assignPermissionsDto,
    });
  }
}
