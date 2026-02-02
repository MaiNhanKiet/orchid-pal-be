import { GoogleLoginDto } from '@app/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'google_login' })
  async handleGoogleLogin(@Payload() googleLoginDto: GoogleLoginDto) {
    return this.authService.handleGoogleLogin({ ...googleLoginDto });
  }
}
