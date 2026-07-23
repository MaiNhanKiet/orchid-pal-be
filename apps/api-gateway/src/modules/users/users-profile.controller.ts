import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  Permissions,
  UpdateProfileDto,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { GrpcRpcService } from '@app/grpc';
import { ApiGetProfileDocs, ApiUpdateProfileDocs } from './user-profile.swagger';

@ApiTags('02 - Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersProfileController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  @Get('me')
  @Permissions(Permission.MeProfileUpdate)
  @ApiGetProfileDocs()
  getMe(@CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.IDENTITY_SERVICE,
      'get_profile',
      { userId: user.sub },
    );
  }

  @Patch('me')
  @Permissions(Permission.MeProfileUpdate)
  @ApiUpdateProfileDocs()
  updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.IDENTITY_SERVICE,
      'update_profile',
      { userId: user.sub, ...dto },
    );
  }
}
