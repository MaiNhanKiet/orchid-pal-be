import { LoginDTO, MICROSERVICES_CLIENTS } from '@app/common';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class UserService {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.USER_SERVICE)
    private readonly userServiceClient: ClientProxy,
  ) {}

  getUser(loginBody: LoginDTO) {
    return this.userServiceClient.send('login', loginBody);
  }
}
