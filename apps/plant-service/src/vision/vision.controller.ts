import { SkipTimeout } from '@app/common';
import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { VisionService } from './vision.service';

@Controller()
export class VisionController {
  constructor(private readonly visionService: VisionService) {}

  @GrpcCmd('analyze_plant_setup')
  @SkipTimeout()
  analyzePlantSetup(
    @Payload()
    payload: {
      plant_id: string;
      user_id: string;
      image_url: string;
      location_city?: string;
      species_name?: string;
    },
  ) {
    return this.visionService.analyzePlantSetup(payload);
  }
}
