import {
    Body,
    Controller,
    Get,
    Inject,
    Param,
    Post,
} from '@nestjs/common';
import {
    MICROSERVICES_CLIENTS,
    ActivateDeviceDto,
    CurrentUser,
    JwtPayload,
    AssignDeviceToZoneDto,
} from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiActivateDeviceDocs, ApiAssignDeviceToZoneDocs, ApiGetDeviceStatusDocs } from './devices.swagger';

@ApiTags('Devices')
@ApiBearerAuth('access-token')
@Controller('devices')
export class DevicesController {
    constructor(
        @Inject(MICROSERVICES_CLIENTS.DEVICE_REGISTRY_SERVICE)
        private readonly deviceRegistryClient: ClientProxy,
    ) { }

    @Post('activate')
    @ApiActivateDeviceDocs()
    activateDevice(
        @Body() activateDeviceDto: ActivateDeviceDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return firstValueFrom(
            this.deviceRegistryClient.send(
                { cmd: 'activate_device' },
                {
                    ...activateDeviceDto,
                    user_id: user.sub,
                },
            ),
        );
    }

    @Get(':serial_number/status')
    @ApiGetDeviceStatusDocs()
    getDeviceStatus(@Param('serial_number') serialNumber: string) {
        return firstValueFrom(
            this.deviceRegistryClient.send(
                { cmd: 'get_device_status' },
                { serial_number: serialNumber },
            ),
        );
    }

    @Post(':serial_number/assign-zone')
    @ApiAssignDeviceToZoneDocs()
    assignDeviceToZone(
        @Param('serial_number') serialNumber: string,
        @Body() body: AssignDeviceToZoneDto,
        @CurrentUser() user: JwtPayload,
    ) {
        return firstValueFrom(
            this.deviceRegistryClient.send(
                { cmd: 'assign_device_to_zone' },
                {
                    serial_number: serialNumber,
                    zone_id: body.zone_id,
                    user_id: user.sub,
                },
            ),
        );
    }
}
