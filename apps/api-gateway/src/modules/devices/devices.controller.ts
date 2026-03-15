import {
  ActivateDeviceDto,
  AssignDeviceToZoneDto,
  CurrentUser,
  DeviceAssignedZoneEventDto,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  Permissions,
} from '@app/common';
import { Permission } from '@app/common/enums';
import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IsUUID } from 'class-validator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import {
  ApiActivateDeviceDocs,
  ApiAssignDeviceToZoneDocs,
  ApiGetDeviceStatusDocs,
  ApiTestAutomationQueueDocs,
} from './devices.swagger';

class TestAutomationQueueDto {
  @IsUUID()
  device_id: string;

  @IsUUID()
  zone_id: string;

  @IsUUID()
  user_id: string;
}

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

  @Post('automation/test-queue')
  @Permissions(Permission.DeviceAssignZone)
  @ApiTestAutomationQueueDocs()
  async testAutomationQueue(@Body() body: TestAutomationQueueDto) {
    const payload: DeviceAssignedZoneEventDto = {
      device_id: body.device_id,
      zone_id: body.zone_id,
      user_id: body.user_id,
    };

    await firstValueFrom(
      this.automationClient.emit('device.assigned.zone', payload),
    );

    return {
      message: 'Sent event to AUTOMATION queue',
      payload,
    };
  }
}
