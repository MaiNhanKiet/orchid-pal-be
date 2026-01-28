import { Body, Controller, Get } from '@nestjs/common';
import { UserServiceService } from './user-service.service';
import { MessagePattern } from '@nestjs/microservices';
import { LoginDTO } from '@app/common';

@Controller()
export class UserServiceController {
  constructor(private readonly userServiceService: UserServiceService) {}

  @MessagePattern('login')
  login(loginBody: LoginDTO) {
    return this.userServiceService.login(loginBody);
  }
}
