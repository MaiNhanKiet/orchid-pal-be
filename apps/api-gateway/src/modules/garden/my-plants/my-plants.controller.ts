import {
  AssignPlantToZoneDto,
  CreateMyPlantDto,
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  PaginationDto,
  Permissions,
  UpdateMyPlantDto,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { GrpcRpcService } from '@app/grpc';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiCreateMyPlantDocs,
  ApiUpdateMyPlantDocs,
} from './my-plants.swagger';

@ApiTags('13 - My Plants')
@ApiBearerAuth('access-token')
@Controller('my-plants')
export class MyPlantsController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  @Get()
  getMyPlants(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationDto,
  ) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.BALCONY_SERVICE, 'get_my_plants', {
      user_id: user.sub,
      ...query,
    });
  }

  @Get(':id')
  getMyPlantDetail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      'get_my_plant_detail',
      {
        user_id: user.sub,
        plant_id: id,
      },
    );
  }

  @Post()
  @Permissions(Permission.MyPlantCreate)
  @ApiCreateMyPlantDocs()
  createMyPlant(
    @Body() createMyPlantDto: CreateMyPlantDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.BALCONY_SERVICE, 'create_my_plant', {
      ...createMyPlantDto,
      user_id: user.sub,
    });
  }

  @Put(':id')
  @ApiUpdateMyPlantDocs()
  updateMyPlant(
    @Param('id') id: string,
    @Body() updateMyPlantDto: UpdateMyPlantDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.BALCONY_SERVICE, 'update_my_plant', {
      plant_id: id,
      user_id: user.sub,
      ...updateMyPlantDto,
    });
  }

  @Post(':id/assign')
  @Permissions(Permission.MyPlantCreate)
  assignPlantToZone(
    @Param('id') id: string,
    @Body() body: Omit<AssignPlantToZoneDto, 'plant_id'>,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      'assign_plant_to_zone',
      {
        plant_id: id,
        zone_id: body.zone_id,
        user_id: user.sub,
      },
    );
  }

  @Delete(':id')
  removePlant(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      'remove_plant_from_garden',
      {
        plant_id: id,
        user_id: user.sub,
      },
    );
  }
}
