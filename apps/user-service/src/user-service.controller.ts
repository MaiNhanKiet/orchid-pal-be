import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './user-service.service';
import { GoogleLoginDto } from '@app/common';
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('google_login')
  async handleGoogleLogin(
    @Payload()
    data: GoogleLoginDto,
  ) {
    // return this.usersService.handleGoogleLogin(data);
  }
}
