import {
  GoogleLoginDto,
  LogoutCommandDto,
  RefreshTokenCommandDto,
} from '@app/common';
import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @GrpcCmd('google_login')
  async handleGoogleLogin(@Payload() googleLoginDto: GoogleLoginDto) {
    return this.authService.handleGoogleLogin({ ...googleLoginDto });
  }

  @GrpcCmd('refresh_token')
  async handleRefreshToken(
    @Payload() refreshTokenCommandDto: RefreshTokenCommandDto,
  ) {
    return this.authService.refreshToken({ ...refreshTokenCommandDto });
  }

  @GrpcCmd('logout')
  async handleLogout(@Payload() logoutCommandDto: LogoutCommandDto) {
    return this.authService.logout({ ...logoutCommandDto });
  }
}
