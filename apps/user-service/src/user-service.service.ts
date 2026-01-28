import { LoginDTO } from '@app/common';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class UserServiceService {
  login(loginBody: LoginDTO) {
    throw new NotFoundException('Không tìm thấy User này');
    return {
      message: 'User logged in successfully',
      token: loginBody.token,
    };
  }
}
