import {
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  PaginationDto,
  Permissions,
  Public,
  UuidDto,
} from '@app/common';
import {
  CreateSpeciesWikiCommandDto,
  CreateSpeciesWikiDto,
  UpdateSpeciesWikiCommandDto,
  UpdateSpeciesWikiDto,
} from '@app/common/dtos/garden/species-wiki.dto';
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
import { ApiGetAllSpeciesDocs, ApiGetSpeciesByIdDocs } from './species.swagger';

@ApiTags('11 - Plant Wiki')
@Controller('plant-wiki')
export class PlantWikiController {
  constructor(private readonly grpcRpc: GrpcRpcService) {}

  @Get()
  @Public()
  @ApiGetAllSpeciesDocs()
  getAllPlants(@Query() paginationDto: PaginationDto) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      'get_all_species',
      paginationDto,
    );
  }

  @Get(':id')
  @Public()
  @ApiGetSpeciesByIdDocs()
  getPlantById(@Param() uuidDto: UuidDto) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      'get_species_by_id',
      uuidDto,
    );
  }

  @Post()
  @ApiBearerAuth('access-token')
  @Permissions(Permission.WikiCreate)
  createPlant(
    @Body() body: CreateSpeciesWikiDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      'create_species',
      {
        ...body,
        author_id: user.sub,
      } as CreateSpeciesWikiCommandDto,
    );
  }

  @Put(':id')
  @ApiBearerAuth('access-token')
  @Permissions(Permission.WikiUpdate)
  updatePlant(@Param() uuidDto: UuidDto, @Body() body: UpdateSpeciesWikiDto) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      'update_species',
      {
        id: uuidDto.id,
        ...body,
      } as UpdateSpeciesWikiCommandDto,
    );
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @Permissions(Permission.WikiDelete)
  deletePlant(@Param() uuidDto: UuidDto) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      'delete_species',
      uuidDto,
    );
  }
}
