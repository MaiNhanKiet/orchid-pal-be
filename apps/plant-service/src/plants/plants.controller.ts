import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  CreatePlantCommandDto,
  UpdatePlantDto,
} from '@app/common/dtos/plant/plant.dto';
import { PlantsService } from './plants.service';

@Controller()
export class PlantsController {
  constructor(private readonly plantsService: PlantsService) {}

  @GrpcCmd('create_plant')
  createPlant(@Payload() data: CreatePlantCommandDto) {
    return this.plantsService.createPlant(data);
  }

  @GrpcCmd('update_plant')
  updatePlant(
    @Payload() data: { plant_id: string; user_id: string } & UpdatePlantDto,
  ) {
    const { plant_id, user_id, ...dto } = data;
    return this.plantsService.updatePlant(plant_id, user_id, dto);
  }

  @GrpcCmd('get_my_plants')
  getMyPlants(@Payload() data: { user_id: string; page?: number; limit?: number }) {
    return this.plantsService.getMyPlants(data);
  }

  @GrpcCmd('get_plant_detail')
  getPlantDetail(@Payload() data: { user_id: string; plant_id: string }) {
    return this.plantsService.getPlantDetail(data);
  }

  @GrpcCmd('remove_plant')
  removePlant(@Payload() data: { plant_id: string; user_id: string }) {
    return this.plantsService.removePlant(data.plant_id, data.user_id);
  }

  @GrpcCmd('apply_ai_analysis')
  applyAiAnalysis(
    @Payload()
    data: {
      plant_id: string;
      user_id: string;
      analysis: object;
      thresholds: object;
    },
  ) {
    return this.plantsService.applyAiAnalysis(
      data.plant_id,
      data.user_id,
      data.analysis,
      data.thresholds,
    );
  }
}
