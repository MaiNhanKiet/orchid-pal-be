import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';
import { Permissions } from '@app/common';
import { Permission } from '@app/common/enums';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Permissions(Permission.Unlock_Room)
  getUser() {
    return { message: 'User data from API Gateway' };
  }
}
