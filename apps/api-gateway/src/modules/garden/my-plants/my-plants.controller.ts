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
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import {
  ApiCreateMyPlantDocs,
  ApiUpdateMyPlantDocs,
} from './my-plants.swagger';

@ApiTags('My Plants')
@ApiBearerAuth('access-token')
@Controller('my-plants')
export class MyPlantsController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.GARDEN_SERVICE)
    private readonly gardenClient: ClientProxy,
  ) { }

  @Post()
  @Permissions(Permission.MyPlantCreate)
  @ApiCreateMyPlantDocs()
  createMyPlant(
    @Body() createMyPlantDto: CreateMyPlantDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return firstValueFrom(
      this.gardenClient.send(
        { cmd: 'create_my_plant' },
        {
          ...createMyPlantDto,
          user_id: user.sub,
        },
      ),
    );
  }

  @Patch(':id')
  // @Permissions(Permission.MyPlantUpdate)
  @ApiUpdateMyPlantDocs()
  updateMyPlant(
    @Param('id') id: string,
    @Body() updateMyPlantDto: UpdateMyPlantDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return firstValueFrom(
      this.gardenClient.send(
        { cmd: 'update_my_plant' },
        {
          plant_id: id,
          user_id: user.sub,
          ...updateMyPlantDto,
        },
      ),
    );
  }

  @Post('assign-zone')
  @Permissions(Permission.MyPlantCreate)
  assignPlantToZone(
    @Body() body: AssignPlantToZoneDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return firstValueFrom(
      this.gardenClient.send(
        { cmd: 'assign_plant_to_zone' },
        {
          ...body,
          user_id: user.sub,
        },
      ),
    );
  }

  @Get()
  // @Permissions(Permission.MyPlantRead)
  get_my_plants(
    @CurrentUser() user: JwtPayload,
    @Query() query: PaginationDto,
  ) {
    return firstValueFrom(
      this.gardenClient.send(
        { cmd: 'get_my_plants' },
        {
          user_id: user.sub,
          ...query,
        },
      ),
    );
  }

  @Get(':id')
  getMyPlantDetail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return firstValueFrom(
      this.gardenClient.send(
        { cmd: 'get_my_plant_detail' },
        {
          user_id: user.sub,
          plant_id: id,
        },
      ),
    );
  }

  @Delete(':id/remove-garden')
  removePlantFromGarden(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return firstValueFrom(
      this.gardenClient.send(
        { cmd: 'remove_plant_from_garden' },
        {
          plant_id: id,
          user_id: user.sub,
        },
      ),
    );
  }
}
