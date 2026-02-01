import { GoogleLoginDto, PaginationDto } from '@app/common';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'get_users' })
  async getUsers(@Payload() paginationDto: PaginationDto) {
    const users = await this.usersService.findAll({
      ...paginationDto,
    });
    return users;
  }
}
