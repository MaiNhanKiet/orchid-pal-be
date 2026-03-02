import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SpeciesService } from './species.service';
import { PaginationDto, UuidDto } from '@app/common';

@Controller()
export class SpeciesController {
  constructor(private readonly speciesService: SpeciesService) {}

  @MessagePattern({ cmd: 'get_all_species' })
  getAllSpecies(@Payload() pagination: PaginationDto) {
    return this.speciesService.getAllSpecies(pagination);
  }

  @MessagePattern({ cmd: 'get_species_by_id' })
  getSpeciesById(@Payload() id: UuidDto) {
    return this.speciesService.getSpeciesById(id.id);
  }
}
