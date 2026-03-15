import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MyPlantsService } from './my-plants.service';
import {
  CreateMyPlantCommandDto,
  GetPlantsByZoneDto,
} from '@app/common/dtos/garden/my-plant.dto';

@Controller()
export class MyPlantsController {
  constructor(private readonly myPlantsService: MyPlantsService) { }

  @MessagePattern({ cmd: 'create_my_plant' })
  createMyPlant(@Payload() data: CreateMyPlantCommandDto) {
    return this.myPlantsService.createMyPlant(data);
  }

  @MessagePattern({ cmd: 'get_plants_by_zone' })
  getPlantsByZone(@Payload() data: { zone_id: string }) {
    return this.myPlantsService.getPlantsByZone(data.zone_id);
  }
}
