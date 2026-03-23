import {
  AssignPlantToZoneCommandDto,
  CreateMyPlantCommandDto,
  UpdateMyPlantDto,
} from '@app/common/dtos/garden/my-plant.dto';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MyPlantsService } from './my-plants.service';

@Controller()
export class MyPlantsController {
  constructor(private readonly myPlantsService: MyPlantsService) { }

  @MessagePattern({ cmd: 'create_my_plant' })
  createMyPlant(@Payload() data: CreateMyPlantCommandDto) {
    return this.myPlantsService.createMyPlant(data);
  }

  @MessagePattern({ cmd: 'update_my_plant' })
  updateMyPlant(
    @Payload() data: UpdateMyPlantDto & { plant_id: string; user_id: string },
  ) {
    const { plant_id, user_id, ...updateDto } = data;
    return this.myPlantsService.updateMyPlant(plant_id, user_id, updateDto);
  }

  @MessagePattern({ cmd: 'assign_plant_to_zone' })
  assignPlantToZone(@Payload() data: AssignPlantToZoneCommandDto) {
    return this.myPlantsService.assignPlantToZone(data);
  }

  @MessagePattern({ cmd: 'get_plants_by_zone' })
  getPlantsByZone(@Payload() data: { zone_id: string }) {
    return this.myPlantsService.getPlantsByZone(data.zone_id);
  }

  @MessagePattern({ cmd: 'get_my_plants' })
  getMyPlants(
    @Payload() data: { user_id: string; page?: number; limit?: number },
  ) {
    return this.myPlantsService.getMyPlants(data);
  }

  @MessagePattern({ cmd: 'get_my_plant_detail' })
  getMyPlantDetail(@Payload() data: { user_id: string; plant_id: string }) {
    return this.myPlantsService.getMyPlantDetail(data);
  }

  @MessagePattern({ cmd: 'count_plants_in_zone' })
  countPlantsInZone(@Payload() data: { zone_id: string }) {
    return this.myPlantsService.countPlantsInZone(data.zone_id);
  }

  @MessagePattern({ cmd: 'remove_plant_from_garden' })
  removePlantFromGarden(
    @Payload() data: { plant_id: string; user_id: string },
  ) {
    return this.myPlantsService.removePlantFromGarden(data.plant_id, data.user_id);
  }
}
