import {
  ActivateDeviceDto,
  AssignDeviceToPlantDto,
  AssignDeviceToUserDto,
  ControlDeviceDto,
  CreateDeviceDto,
  CurrentUser,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  PaginationDto,
  Permissions,
  QueryDevicesDto,
  SkipTimeout,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { GrpcRpcService } from '@app/grpc';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DeviceQrService } from './device-qr.service';
import {
  ApiActivateDeviceDocs,
  ApiAssignDeviceToPlantDocs,
  ApiControlDeviceDocs,
  ApiAssignDeviceToUserDocs,
  ApiForceUnbindDeviceDocs,
  ApiGetAllDevicesDocs,
  ApiGetDeviceActivationQrDocs,
  ApiGetDeviceDetailDocs,
  ApiGetDeviceLogsDocs,
  ApiGetDeviceStatusDocs,
  ApiGetLatestDeviceDocs,
  ApiImportDeviceDocs,
} from './devices.swagger';

@ApiTags('06 - Devices')
@ApiBearerAuth('access-token')
@Controller('devices')
export class DevicesController {
  constructor(
    private readonly grpcRpc: GrpcRpcService,
    private readonly deviceQrService: DeviceQrService,
  ) {}

  @Get()
  @Permissions(Permission.DeviceViewAll)
  @ApiGetAllDevicesDocs()
  listDevices(@Query() query: QueryDevicesDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'list_devices', query);
  }

  @Post()
  @Permissions(Permission.DeviceProvision)
  @ApiImportDeviceDocs()
  async createDevice(@Body() body: CreateDeviceDto) {
    const device = await this.grpcRpc.send<{
      id: string;
      serial_number: string;
      secret_key: string;
      qr_image_url?: string | null;
    }>(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'create_device', body);

    return this.deviceQrService.ensureDeviceHasQr(device);
  }

  @Post('activate')
  @Permissions(Permission.DeviceActivate)
  @ApiActivateDeviceDocs()
  activateDevice(@Body() dto: ActivateDeviceDto, @CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'activate_device', {
      ...dto,
      user_id: user.sub,
    });
  }

  @Get('mine')
  @Permissions(Permission.DeviceView)
  getMyDevices(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'get_my_devices', {
      user_id: user.sub,
      ...query,
    });
  }

  @Get('mine/logs/:serialNumber')
  @Permissions(Permission.DeviceViewLogs)
  @ApiGetDeviceLogsDocs()
  getMyDeviceLogs(
    @Param('serialNumber') serialNumber: string,
    @Query() query: PaginationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'get_my_device_logs', {
      serial_number: serialNumber,
      user_id: user.sub,
      page: Number(query.page ?? 1),
      limit: Number(query.limit ?? 10),
    });
  }

  @Get('mine/:id')
  @Permissions(Permission.DeviceView)
  getMyDeviceDetail(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'get_my_device_detail', {
      user_id: user.sub,
      device_id: id,
    });
  }

  @Get('latest')
  @Permissions(Permission.DeviceView)
  @ApiGetLatestDeviceDocs()
  getLatestDevice(@CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'get_latest_device', {
      user_id: user.sub,
    });
  }

  @Get('status/:serialNumber')
  @Permissions(Permission.DeviceView)
  @ApiGetDeviceStatusDocs()
  getDeviceStatus(@Param('serialNumber') serialNumber: string) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'get_device_status', {
      serial_number: serialNumber,
    });
  }

  @Get('logs/:serialNumber')
  @Permissions(Permission.DeviceViewLogs)
  @ApiGetDeviceLogsDocs()
  getDeviceLogs(
    @Param('serialNumber') serialNumber: string,
    @Query() query: PaginationDto,
  ) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'get_device_logs', {
      device_id: serialNumber,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':id/activation-qr')
  @Permissions(Permission.DeviceProvision)
  @ApiGetDeviceActivationQrDocs()
  getDeviceActivationQr(@Param('id') id: string) {
    return this.deviceQrService.getActivationQr(id);
  }

  @Get(':id')
  @Permissions(Permission.DeviceViewAll)
  @ApiGetDeviceDetailDocs()
  getDeviceById(@Param('id') id: string) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'get_device_by_id', id);
  }

  @Post(':id/assign-plant')
  @Permissions(Permission.DeviceAssignZone)
  @SkipTimeout()
  @ApiAssignDeviceToPlantDocs()
  async assignDeviceToPlant(
    @Param('id') id: string,
    @Body() body: AssignDeviceToPlantDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const device = await this.grpcRpc.send<{ serial_number: string }>(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'get_device_by_id',
      id,
    );
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'assign_device_to_plant', {
      serial_number: device.serial_number,
      plant_id: body.plant_id,
      user_id: user.sub,
    });
  }

  @Post(':id/control')
  @Permissions(Permission.MeDeviceControl)
  @ApiControlDeviceDocs()
  async controlDevice(
    @Param('id') id: string,
    @Body() body: ControlDeviceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const device = await this.grpcRpc.send<{ serial_number: string }>(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'get_my_device_detail',
      { user_id: user.sub, device_id: id },
    );
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'manual_control_device', {
      serial_number: device.serial_number,
      role: body.role,
      action: body.action,
      relay_port: body.relay_port,
      user_id: user.sub,
    });
  }

  @Post(':id/unbind')
  @Permissions(Permission.MeGardenManage)
  unbindDevice(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'remove_device_from_plant', {
      device_id: id,
      user_id: user.sub,
    });
  }

  @Post(':id/force-unbind')
  @Permissions(Permission.DeviceProvision)
  @ApiForceUnbindDeviceDocs()
  forceUnbindDevice(@Param('id') id: string) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'force_unbind_device', id);
  }

  @Post(':id/assign-owner')
  @Permissions(Permission.DeviceProvision)
  @ApiAssignDeviceToUserDocs()
  assignDeviceToUser(@Param('id') id: string, @Body() body: AssignDeviceToUserDto) {
    return this.grpcRpc.send(MICROSERVICES_CLIENTS.PLANT_SERVICE, 'assign_device_to_user', {
      device_id: id,
      user_id: body.user_id,
    });
  }
}
