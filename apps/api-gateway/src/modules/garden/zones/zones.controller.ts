import {
    Body,
    Controller,
    Inject,
    Post,
} from '@nestjs/common';
import {
    MICROSERVICES_CLIENTS,
    CreateZoneDto,
    CurrentUser,
    JwtPayload,
    Permissions,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiCreateZoneDocs } from './zones.swagger';

@ApiTags('Zones')
@ApiBearerAuth('access-token')
@Controller('zones')
export class ZonesController {
    constructor(
        @Inject(MICROSERVICES_CLIENTS.GARDEN_SERVICE)
        private readonly gardenClient: ClientProxy,
    ) { }

    @Post()
    @Permissions(Permission.ZoneCreate)
    @ApiCreateZoneDocs()
    createZone(
        @Body() createZoneDto: CreateZoneDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return firstValueFrom(
            this.gardenClient.send(
                { cmd: 'create_zone' },
                {
                    ...createZoneDto,
                    user_id: user.sub,
                },
            ),
        );
    }
}

