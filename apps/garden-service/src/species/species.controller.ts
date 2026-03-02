import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SpeciesService } from './species.service';
import { PaginationDto, UuidDto } from '@app/common';
import {
  CreateSpeciesWikiCommandDto,
  UpdateSpeciesWikiCommandDto,
} from '@app/common/dtos/garden/species-wiki.dto';

@Controller()
export class SpeciesController {
  constructor(private readonly speciesService: SpeciesService) { }

  @MessagePattern({ cmd: 'get_all_species' })
  getAllSpecies(@Payload() pagination: PaginationDto) {
    return this.speciesService.getAllSpecies(pagination);
  }

  @MessagePattern({ cmd: 'get_species_by_id' })
  getSpeciesById(@Payload() id: UuidDto) {
    return this.speciesService.getSpeciesById(id.id);
  }

  @MessagePattern({ cmd: 'create_species' })
  createSpecies(@Payload() payload: CreateSpeciesWikiCommandDto) {
    return this.speciesService.createSpecies(payload);
  }

  @MessagePattern({ cmd: 'update_species' })
  updateSpecies(@Payload() payload: UpdateSpeciesWikiCommandDto) {
    const { id, ...data } = payload;
    return this.speciesService.updateSpecies(id, data);
  }

  @MessagePattern({ cmd: 'delete_species' })
  deleteSpecies(@Payload() id: UuidDto) {
    return this.speciesService.deleteSpecies(id.id);
  }
}
