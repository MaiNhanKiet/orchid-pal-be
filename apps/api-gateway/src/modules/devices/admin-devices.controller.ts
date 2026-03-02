import {
    Controller,
    Get,
    Post,
    Body,
    Inject,
    Param,
    Query,
} from '@nestjs/common';
import {
    MICROSERVICES_CLIENTS,
    Permissions,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
    ApiForceUnbindDeviceDocs,
    ApiGetAllDevicesDocs,
    ApiGetDeviceDetailDocs,
    ApiImportDeviceDocs,
} from './devices.swagger';
import {
    CreateDeviceDto,
    QueryDevicesDto,
} from '@app/common/dtos/device/device.dto';

@ApiTags('Devices')
@ApiBearerAuth('access-token')
@Controller('admin/devices')
export class AdminDevicesController {
    constructor(
        @Inject(MICROSERVICES_CLIENTS.DEVICE_REGISTRY_SERVICE)
        private readonly deviceRegistryClient: ClientProxy,
    ) { }

    @Post()
    @Permissions(Permission.DeviceProvision)
    @ApiImportDeviceDocs()
    importDevice(@Body() body: CreateDeviceDto) {
        return firstValueFrom(
            this.deviceRegistryClient.send(
                { cmd: 'create_device' },
                body,
            ),
        );
    }

    @Get()
    @Permissions(Permission.DeviceViewAll)
    @ApiGetAllDevicesDocs()
    getAllDevices(@Query() query: QueryDevicesDto) {
        return firstValueFrom(
            this.deviceRegistryClient.send(
                { cmd: 'list_devices' },
                query,
            ),
        );
    }

    @Get(':id')
    @Permissions(Permission.DeviceViewAll)
    @ApiGetDeviceDetailDocs()
    getDeviceDetail(@Param('id') id: string) {
        return firstValueFrom(
            this.deviceRegistryClient.send(
                { cmd: 'get_device_by_id' },
                id,
            ),
        );
    }

    @Post(':id/force-unbind')
    @Permissions(Permission.DeviceProvision)
    @ApiForceUnbindDeviceDocs()
    forceUnbindDevice(@Param('id') id: string) {
        return firstValueFrom(
            this.deviceRegistryClient.send(
                { cmd: 'force_unbind_device' },
                id,
            ),
        );
    }
}

