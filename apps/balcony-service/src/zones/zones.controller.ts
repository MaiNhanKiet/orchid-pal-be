import {
  CreateZoneCommandDto,
  UpdateZoneDto,
} from '@app/common/dtos/garden/zone.dto';
import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { BalconyZonesService } from './zones.service';

@Controller()
export class BalconyZonesController {
  constructor(private readonly zonesService: BalconyZonesService) { }

  @GrpcCmd('create_zone')
  createZone(@Payload() data: CreateZoneCommandDto) {
    return this.zonesService.createZone(data);
  }

  @GrpcCmd('get_zones_by_user')
  getZonesByUser(@Payload() data: { user_id: string }) {
    return this.zonesService.getZonesByUser(data.user_id);
  }

  @GrpcCmd('get_zone_detail')
  getZoneDetail(@Payload() data: { zone_id: string; user_id: string }) {
    return this.zonesService.getZoneDetail(data.zone_id, data.user_id);
  }

  @GrpcCmd('get_zone_automation_rules')
  getZoneAutomationRules(
    @Payload() data: { zone_id: string; user_id: string },
  ) {
    return this.zonesService.getZoneAutomationRules(data.zone_id, data.user_id);
  }

  @GrpcCmd('update_zone')
  updateZone(
    @Payload() data: UpdateZoneDto & { zone_id: string; user_id: string },
  ) {
    const { zone_id, user_id, ...updateDto } = data;
    return this.zonesService.updateZone(zone_id, user_id, updateDto);
  }

  @GrpcCmd('delete_zone')
  deleteZone(@Payload() data: { zone_id: string; user_id: string }) {
    return this.zonesService.deleteZone(data.zone_id, data.user_id);
  }

  @GrpcCmd('get_zone_current_plant_for_rule')
  getZoneCurrentPlantForRule(
    @Payload() data: { zone_id: string; user_id: string },
  ) {
    return this.zonesService.getZoneCurrentPlantForRule(data.zone_id, data.user_id);
  }
}
