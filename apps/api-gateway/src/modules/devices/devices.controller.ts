import {
  ActivateDeviceDto,
  AssignDeviceToZoneDto,
  CurrentUser,
  DeviceAssignedZoneEventDto,
  JwtPayload,
  MICROSERVICES_CLIENTS,
  Permissions,
  ControlDeviceDto,
  HardwareConfig,
} from '@app/common';
import { Permission } from '@app/common/enums';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IsUUID } from 'class-validator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
import {
  ApiActivateDeviceDocs,
  ApiAssignDeviceToZoneDocs,
  ApiGetDeviceStatusDocs,
  ApiTestAutomationQueueDocs,
  ApiControlDeviceDocs,
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

  @Post(':serial_number/control')
  @Permissions(Permission.MeDeviceControl)
  @ApiControlDeviceDocs()
  async controlDevice(
    @Param('serial_number') serialNumber: string,
    @Body() body: ControlDeviceDto,
  ) {
    const device = await firstValueFrom(
      this.deviceRegistryClient.send(
        { cmd: 'get_device_by_serial' },
        { serial_number: serialNumber },
      ),
    );

    if (!device) {
      throw new NotFoundException(
        'Thiết bị không tồn tại. Vui lòng kiểm tra lại serial number.',
      );
    }

    const hardwareConfig = (device.hardware_config || {}) as HardwareConfig;
    const relays = hardwareConfig.relays || {};

    const roleRelayEntries: Array<[number, string | null | undefined]> = [
      [1, relays.relay_1],
      [2, relays.relay_2],
      [3, relays.relay_3],
      [4, relays.relay_4],
    ];

    const relayNumber = roleRelayEntries.find(([, role]) => role === body.role)?.[0];

    if (!relayNumber) {
      throw new BadRequestException(
        'Thiết bị chưa cấu hình relay cho role này.',
      );
    }

    const payload = {
      serial_number: serialNumber,
      relay_number: relayNumber,
      role: body.role,
      action: body.action,
    };

    this.automationClient.emit('send.manual.control', payload);

    return {
      message: 'Đã gửi lệnh điều khiển relay',
      payload,
    };
  }
}
