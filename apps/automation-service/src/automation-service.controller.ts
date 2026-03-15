import { DeviceAssignedZoneEventDto, RmqService } from '@app/common';
import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { AutomationServiceService } from './automation-service.service';

@Controller()
export class AutomationServiceController {
  constructor(
    private readonly automationServiceService: AutomationServiceService,
    private readonly rmqService: RmqService,
  ) { }

  @EventPattern('device.assigned.zone')
  async handleDeviceAssigned(
    @Payload() data: DeviceAssignedZoneEventDto,
    @Ctx() context: RmqContext,
  ) {
    await this.automationServiceService.handleDeviceAssignedZone(data);
    this.rmqService.ack(context);
  }
}
