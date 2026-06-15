import {
  CreateZoneDto,
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  Permissions,
  UpdateZoneDto,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { GrpcRpcService } from '@app/grpc';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiCreateZoneDocs,
  ApiGetZoneDetailDocs,
  ApiGetZonesDocs,
} from './zones.swagger';

@ApiTags('12 - Balcony Zones')
@ApiBearerAuth('access-token')
@Controller('balcony-zones')
export class ZonesController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  @Get()
  @Permissions(Permission.ZoneRead)
  @ApiGetZonesDocs()
  getMyZones(@CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      'get_zones_by_user',
      { user_id: user.sub },
    );
  }

  @Get(':id')
  @Permissions(Permission.ZoneRead)
  @ApiGetZoneDetailDocs()
  getZoneDetail(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      'get_zone_detail',
      { zone_id: id, user_id: user.sub },
    );
  }

  @Post()
  @Permissions(Permission.ZoneCreate)
  @ApiCreateZoneDocs()
  createZone(
    @Body() createZoneDto: CreateZoneDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.BALCONY_SERVICE, 'create_zone', {
      ...createZoneDto,
      user_id: user.sub,
    });
  }

  @Patch(':id')
  updateZone(
    @Param('id') id: string,
    @Body() body: UpdateZoneDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.BALCONY_SERVICE, 'update_zone', {
      zone_id: id,
      user_id: user.sub,
      ...body,
    });
  }

  @Delete(':id')
  deleteZone(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.BALCONY_SERVICE, 'delete_zone', {
      zone_id: id,
      user_id: user.sub,
    });
  }
}
