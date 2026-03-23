import {
  ActivateDeviceDto,
  AssignDeviceToZoneDto,
  ControlDeviceDto,
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  PaginationDto,
  Permissions,
} from '@app/common';
import { Permission } from '@app/common/enums';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import {
  ApiActivateDeviceDocs,
  ApiAssignDeviceToZoneDocs,
  ApiControlDeviceDocs,
  ApiGetDeviceLogsDocs,
  ApiGetDeviceStatusDocs,
  ApiGetLatestDeviceDocs,
} from './devices.swagger';

@ApiTags('Devices')
@ApiBearerAuth('access-token')
@Controller('devices')
export class DevicesController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.DEVICE_REGISTRY_SERVICE)
    private readonly deviceRegistryClient: ClientProxy,
    @Inject('AUTOMATION') private readonly automationClient: ClientProxy,
  ) { }

  @Post('activate')
  @Permissions(Permission.DeviceActivate)
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

  @Get('latest')
  // @Permissions(Permission.DeviceView)
  @ApiGetLatestDeviceDocs()
  getLatestDevice(@CurrentUser() user: JwtPayload) {
    return firstValueFrom(
      this.deviceRegistryClient.send(
        { cmd: 'get_latest_device' },
        { user_id: user.sub },
      ),
    );
  }

  @Get(':serial_number/status')
  @Permissions(Permission.MeDeviceControl)
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
  @Permissions(Permission.DeviceAssignZone)
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

  @Post(':serial_number/control')
  @Permissions(Permission.MeDeviceControl)
  @ApiControlDeviceDocs()
  async controlDevice(
    @Param('serial_number') serialNumber: string,
    @Body() body: ControlDeviceDto,
  ) {
    return firstValueFrom(
      this.deviceRegistryClient.send(
        { cmd: 'manual_control_device' },
        {
          serial_number: serialNumber,
          role: body.role,
          action: body.action,
        },
      ),
    );
  }

  @Get()
  getMyDevices(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return firstValueFrom(
      this.deviceRegistryClient.send(
        { cmd: 'get_my_devices' },
        {
          user_id: user.sub,
          ...query,
        },
      ),
    );
  }

  @Get(':id')
  getMyDeviceDetail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return firstValueFrom(
      this.deviceRegistryClient.send(
        { cmd: 'get_my_device_detail' },
        {
          user_id: user.sub,
          device_id: id,
        },
      ),
    );
  }

  @Get(':serial_number/logs')
  @Permissions(Permission.DeviceViewLogs)
  @ApiGetDeviceLogsDocs()
  getDeviceLogs(
    @Param('serial_number') serialNumber: string,
    @Query() query: PaginationDto,
  ) {
    return firstValueFrom(
      this.automationClient.send(
        { cmd: 'get_device_logs' },
        {
          device_id: serialNumber,
          page: query.page,
          limit: query.limit,
        },
      ),
    );
  }

  @Delete(':id/remove-garden')
  removeDeviceFromGarden(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return firstValueFrom(
      this.deviceRegistryClient.send(
        { cmd: 'remove_device_from_garden' },
        {
          device_id: id,
          user_id: user.sub,
        },
      ),
    );
  }
}
