import {
  ActivateDeviceDto,
  ControlDeviceDto,
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  PaginationDto,
  Permissions,
} from '@app/common';
import {
  CreateDeviceDto,
  QueryDevicesDto,
} from '@app/common/dtos/device/device.dto';
import { Permission } from '@app/common/enums';
import { GrpcRpcService } from '@app/grpc';
import {
  Body,
  Controller,
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
  ApiForceUnbindDeviceDocs,
  ApiGetAllDevicesDocs,
  ApiGetDeviceDetailDocs,
  ApiGetDeviceLogsDocs,
  ApiGetDeviceStatusDocs,
  ApiGetLatestDeviceDocs,
  ApiImportDeviceDocs,
} from './devices.swagger';

@ApiTags('14 - Devices')
@ApiBearerAuth('access-token')
@Controller('devices')
export class DevicesController {
  constructor(
    private readonly grpcRpc: GrpcRpcService,
    @Inject('AUTOMATION') private readonly automationClient: ClientProxy,
  ) {}

  @Get()
  @Permissions(Permission.DeviceViewAll)
  @ApiGetAllDevicesDocs()
  listDevices(@Query() query: QueryDevicesDto) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      'list_devices',
      query,
    );
  }

  @Post()
  @Permissions(Permission.DeviceProvision)
  @ApiImportDeviceDocs()
  createDevice(@Body() body: CreateDeviceDto) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      'create_device',
      body,
    );
  }

  @Post('activate')
  @Permissions(Permission.DeviceActivate)
  @ApiActivateDeviceDocs()
  activateDevice(
    @Body() activateDeviceDto: ActivateDeviceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      'activate_device',
      {
        ...activateDeviceDto,
        user_id: user.sub,
      },
    );
  }

  @Get('mine')
  getMyDevices(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      'get_my_devices',
      {
        user_id: user.sub,
        ...query,
      },
    );
  }

  @Get('latest')
  @ApiGetLatestDeviceDocs()
  getLatestDevice(@CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      'get_latest_device',
      { user_id: user.sub },
    );
  }

  @Get('status/:serialNumber')
  @Permissions(Permission.MeDeviceControl)
  @ApiGetDeviceStatusDocs()
  getDeviceStatus(@Param('serialNumber') serialNumber: string) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      'get_device_status',
      { serial_number: serialNumber },
    );
  }

  @Get('logs/:serialNumber')
  @Permissions(Permission.DeviceViewLogs)
  @ApiGetDeviceLogsDocs()
  getDeviceLogs(
    @Param('serialNumber') serialNumber: string,
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

  @Get(':id')
  @Permissions(Permission.DeviceViewAll)
  @ApiGetDeviceDetailDocs()
  getDeviceById(@Param('id') id: string) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      'get_device_by_id',
      id,
    );
  }

  @Post(':id/assign')
  @Permissions(Permission.DeviceAssignZone)
  @ApiAssignDeviceToZoneDocs()
  async assignDeviceToZone(
    @Param('id') id: string,
    @Body() body: { zone_id: string },
    @CurrentUser() user: JwtPayload,
  ) {
    const device = await this.grpcRpc.send<{ serial_number: string }>(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      'get_device_by_id',
      id,
    );
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      'assign_device_to_zone',
      {
        serial_number: device.serial_number,
        zone_id: body.zone_id,
        user_id: user.sub,
      },
    );
  }

  @Post(':id/control')
  @Permissions(Permission.MeDeviceControl)
  @ApiControlDeviceDocs()
  async controlDevice(
    @Param('id') id: string,
    @Body() body: ControlDeviceDto,
  ) {
    const device = await this.grpcRpc.send<{ serial_number: string }>(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      'get_device_by_id',
      id,
    );
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      'manual_control_device',
      {
        serial_number: device.serial_number,
        role: body.role,
        action: body.action,
      },
    );
  }

  @Post(':id/unbind')
  unbindDevice(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      'remove_device_from_garden',
      {
        device_id: id,
        user_id: user.sub,
      },
    );
  }

  @Post(':id/force-unbind')
  @Permissions(Permission.DeviceProvision)
  @ApiForceUnbindDeviceDocs()
  forceUnbindDevice(@Param('id') id: string) {
    return this.grpcRpc.send(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      'force_unbind_device',
      id,
    );
  }
}
