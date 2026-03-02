import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ZonesService } from './zones.service';
import { CreateZoneCommandDto } from '@app/common/dtos/garden/zone.dto';

@Controller()
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @MessagePattern({ cmd: 'create_zone' })
  createZone(@Payload() data: CreateZoneCommandDto) {
    return this.zonesService.createZone(data);
  }
}
