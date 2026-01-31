import { Controller, Get } from '@nestjs/common';
import { Permissions } from '@app/common';
import { Permission } from '@app/common/enums';

@Controller('user')
export class UserController {
  @Get('profile')
  getProfile() {
    return { message: 'This is a protected user profile route.' };
  }
}
