import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MyPlantsService } from './my-plants.service';
import { CreateMyPlantCommandDto } from '@app/common/dtos/garden/my-plant.dto';

@Controller()
export class MyPlantsController {
    constructor(private readonly myPlantsService: MyPlantsService) { }

    @MessagePattern({ cmd: 'create_my_plant' })
    createMyPlant(@Payload() data: CreateMyPlantCommandDto) {
        return this.myPlantsService.createMyPlant(data);
    }
}

