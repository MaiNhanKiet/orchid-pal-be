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
    Public,
    UuidDto,
} from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiTags } from '@nestjs/swagger';
import {
    ApiGetAllSpeciesDocs,
    ApiGetSpeciesByIdDocs,
} from './species.swagger';

@ApiTags('Species')
@Controller('species')
@Public()
export class SpeciesController {
    constructor(
        @Inject(MICROSERVICES_CLIENTS.GARDEN_SERVICE)
        private readonly gardenClient: ClientProxy,
    ) { }

    @Get()
    @ApiGetAllSpeciesDocs()
    getAllSpecies(@Query() paginationDto: PaginationDto) {
        return firstValueFrom(
            this.gardenClient.send({ cmd: 'get_all_species' }, paginationDto),
        );
    }

    @Get(':id')
    @ApiGetSpeciesByIdDocs()
    getSpeciesById(@Param() uuidDto: UuidDto) {
        return firstValueFrom(
            this.gardenClient.send({ cmd: 'get_species_by_id' }, uuidDto),
        );
    }
}

