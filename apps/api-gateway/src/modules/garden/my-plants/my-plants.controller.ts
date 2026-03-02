import {
    Body,
    Controller,
    Inject,
    Post,
} from '@nestjs/common';
import {
    MICROSERVICES_CLIENTS,
    CreateMyPlantDto,
    CurrentUser,
    JwtPayload,
    Permissions,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiCreateMyPlantDocs } from './my-plants.swagger';

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
}

