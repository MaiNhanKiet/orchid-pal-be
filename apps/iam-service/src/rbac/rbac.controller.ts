import { Controller } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @MessagePattern({ cmd: 'get_roles' })
  async getRoles() {
    const roles = await this.rbacService.findAllRoles();
    return roles;
  }
}
