import {
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  PaginationDto,
  Permissions,
  UuidDto,
} from '@app/common';
import {
  CreateSpeciesWikiCommandDto,
  CreateSpeciesWikiDto,
  UpdateSpeciesWikiCommandDto,
  UpdateSpeciesWikiDto,
} from '@app/common/dtos/garden/species-wiki.dto';
import { Permission } from '@app/common/enums';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import { ApiGetAllSpeciesDocs, ApiGetSpeciesByIdDocs } from './species.swagger';

@ApiTags('Species')
@ApiBearerAuth('access-token')
@Controller('expert/species')
export class ExpertSpeciesController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.GARDEN_SERVICE)
    private readonly gardenClient: ClientProxy,
  ) {}

  @Get()
  @Permissions(
    Permission.WikiCreate,
    Permission.WikiUpdate,
    Permission.WikiDelete,
  )
  @ApiGetAllSpeciesDocs()
  getAllSpecies(@Query() paginationDto: PaginationDto) {
    return firstValueFrom(
      this.gardenClient.send({ cmd: 'get_all_species' }, paginationDto),
    );
  }

  @Get(':id')
  @Permissions(
    Permission.WikiCreate,
    Permission.WikiUpdate,
    Permission.WikiDelete,
  )
  @ApiGetSpeciesByIdDocs()
  getSpeciesById(@Param() uuidDto: UuidDto) {
    return firstValueFrom(
      this.gardenClient.send({ cmd: 'get_species_by_id' }, uuidDto),
    );
  }

  @Post()
  @Permissions(Permission.WikiCreate)
  createSpecies(
    @Body() body: CreateSpeciesWikiDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return firstValueFrom(
      this.gardenClient.send({ cmd: 'create_species' }, {
        ...body,
        author_id: user.sub,
      } as CreateSpeciesWikiCommandDto),
    );
  }

  @Put(':id')
  @Permissions(Permission.WikiUpdate)
  updateSpecies(@Param() uuidDto: UuidDto, @Body() body: UpdateSpeciesWikiDto) {
    return firstValueFrom(
      this.gardenClient.send({ cmd: 'update_species' }, {
        id: uuidDto.id,
        ...body,
      } as UpdateSpeciesWikiCommandDto),
    );
  }

  @Delete(':id')
  @Permissions(Permission.WikiDelete)
  deleteSpecies(@Param() uuidDto: UuidDto) {
    return firstValueFrom(
      this.gardenClient.send({ cmd: 'delete_species' }, uuidDto),
    );
  }
}
