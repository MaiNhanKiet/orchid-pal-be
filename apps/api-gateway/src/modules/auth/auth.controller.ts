import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from '../users/user.service';
import { LoginDTO, Public } from '@app/common';

@Controller('auth')
@Public()
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  login(@Body() loginBody: LoginDTO) {
    return this.userService.getUser(loginBody);
  }
}
