import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
// Constant tên service bạn định nghĩa trong libs/common/constants
import { MICROSERVICES_CLIENTS, GoogleLoginDto } from '@app/common';

@Injectable()
export class AuthService {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.IAM_SERVICE)
    private readonly iamClient: ClientProxy,
  ) {}

  async validateGoogleUser(socialUser: GoogleLoginDto) {
    return await firstValueFrom(
      this.iamClient.send('google_login', socialUser),
    );
  }
}
