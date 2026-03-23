import {
  CreateZoneCommandDto,
  UpdateZoneDto,
} from '@app/common/dtos/garden/zone.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ZonesService } from './zones.service';

@Controller()
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) { }

  @MessagePattern({ cmd: 'create_zone' })
  createZone(@Payload() data: CreateZoneCommandDto) {
    return this.zonesService.createZone(data);
  }

  @MessagePattern({ cmd: 'get_zones_by_user' })
  getZonesByUser(@Payload() data: { user_id: string }) {
    return this.zonesService.getZonesByUser(data.user_id);
  }

  @MessagePattern({ cmd: 'get_zone_detail' })
  getZoneDetail(@Payload() data: { zone_id: string; user_id: string }) {
    return this.zonesService.getZoneDetail(data.zone_id, data.user_id);
  }

  @MessagePattern({ cmd: 'get_zone_automation_rules' })
  getZoneAutomationRules(
    @Payload() data: { zone_id: string; user_id: string },
  ) {
    return this.zonesService.getZoneAutomationRules(data.zone_id, data.user_id);
  }

  @MessagePattern({ cmd: 'update_zone' })
  updateZone(
    @Payload() data: UpdateZoneDto & { zone_id: string; user_id: string },
  ) {
    const { zone_id, user_id, ...updateDto } = data;
    return this.zonesService.updateZone(zone_id, user_id, updateDto);
  }

  @MessagePattern({ cmd: 'delete_zone' })
  deleteZone(@Payload() data: { zone_id: string; user_id: string }) {
    return this.zonesService.deleteZone(data.zone_id, data.user_id);
  }

  @MessagePattern({ cmd: 'get_zone_current_plant_for_rule' })
  getZoneCurrentPlantForRule(
    @Payload() data: { zone_id: string; user_id: string },
  ) {
    return this.zonesService.getZoneCurrentPlantForRule(data.zone_id, data.user_id);
  }
}
