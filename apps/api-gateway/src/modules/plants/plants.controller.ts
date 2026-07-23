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
import {
  CreatePlantDto,
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  PaginationDto,
  Permissions,
  SkipTimeout,
  UpdatePlantDto,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { GrpcRpcService } from '@app/grpc';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiAnalyzePlantSetupDocs,
  ApiCreatePlantDocs,
  ApiGetMyPlantsDocs,
  ApiGetPlantDetailDocs,
  ApiRemovePlantDocs,
  ApiUpdatePlantDocs,
} from './plants.swagger';

@ApiTags('05 - Plants')
@ApiBearerAuth('access-token')
@Controller('plants')
export class PlantsController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  @Get()
  @Permissions(Permission.MeGardenManage)
  @ApiGetMyPlantsDocs()
  getMyPlants(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'get_my_plants', {
      user_id: user.sub,
      ...query,
    });
  }

  @Get(':id')
  @Permissions(Permission.MeGardenManage)
  @ApiGetPlantDetailDocs()
  getPlantDetail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'get_plant_detail', {
      user_id: user.sub,
      plant_id: id,
    });
  }

  @Post()
  @Permissions(Permission.MyPlantCreate)
  @ApiCreatePlantDocs()
  createPlant(@Body() dto: CreatePlantDto, @CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'create_plant', {
      ...dto,
      user_id: user.sub,
    });
  }

  @Put(':id')
  @Permissions(Permission.MyPlantUpdate)
  @ApiUpdatePlantDocs()
  updatePlant(
    @Param('id') id: string,
    @Body() dto: UpdatePlantDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'update_plant', {
      plant_id: id,
      user_id: user.sub,
      ...dto,
    });
  }

  @Delete(':id')
  @Permissions(Permission.MeGardenManage)
  @ApiRemovePlantDocs()
  removePlant(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'remove_plant', {
      plant_id: id,
      user_id: user.sub,
    });
  }

  @Post(':id/analyze')
  @Permissions(Permission.MyPlantUpdate)
  @SkipTimeout()
  @ApiAnalyzePlantSetupDocs()
  analyzeSetup(
    @Param('id') id: string,
    @Body() body: { image_url: string; location_city?: string; species_name?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'analyze_plant_setup', {
      plant_id: id,
      user_id: user.sub,
      ...body,
    });
  }
}
