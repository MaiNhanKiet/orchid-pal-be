import { Controller } from '@nestjs/common';
import { AutomationServiceService } from './automation-service.service';
import { RmqService, DeviceAssignedZoneEventDto } from '@app/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

@Controller()
export class AutomationServiceController {
  constructor(
    private readonly automationServiceService: AutomationServiceService,
    private readonly rmqService: RmqService,
  ) {}

  @EventPattern('device.assigned.zone')
  async handleDeviceAssigned(
    @Payload() data: DeviceAssignedZoneEventDto,
    @Ctx() context: RmqContext,
  ) {
    await this.automationServiceService.handleDeviceAssignedZone(data);
    this.rmqService.ack(context);
  }
}
