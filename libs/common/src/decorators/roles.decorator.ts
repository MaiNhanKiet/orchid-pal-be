import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums';

export const ROLES_KEY = 'roles';
export const Roles = (role: Role, ...roles: Role[]) =>
  SetMetadata(ROLES_KEY, [role, ...roles]);
