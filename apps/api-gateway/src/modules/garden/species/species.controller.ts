import {
    Controller,
    Get,
    Inject,
    Param,
    Query,
} from '@nestjs/common';
import {
    MICROSERVICES_CLIENTS,
    PaginationDto,
    UuidDto,
    Permissions,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
    ApiGetAllSpeciesDocs,
    ApiGetSpeciesByIdDocs,
} from './species.swagger';

@ApiTags('Species')
@ApiBearerAuth('access-token')
@Controller('species')
export class SpeciesController {
    constructor(
        @Inject(MICROSERVICES_CLIENTS.GARDEN_SERVICE)
        private readonly gardenClient: ClientProxy,
    ) { }

    @Get()
    @Permissions(Permission.MeGardenManage)
    @ApiGetAllSpeciesDocs()
    getAllSpecies(@Query() paginationDto: PaginationDto) {
        return firstValueFrom(
            this.gardenClient.send({ cmd: 'get_all_species' }, paginationDto),
        );
    }

    @Get(':id')
    @Permissions(Permission.MeGardenManage)
    @ApiGetSpeciesByIdDocs()
    getSpeciesById(@Param() uuidDto: UuidDto) {
        return firstValueFrom(
            this.gardenClient.send({ cmd: 'get_species_by_id' }, uuidDto),
        );
    }
}

