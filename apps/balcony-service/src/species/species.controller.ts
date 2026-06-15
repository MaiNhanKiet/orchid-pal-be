import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { SpeciesService } from './species.service';
import { PaginationDto, UuidDto } from '@app/common';
import {
  CreateSpeciesWikiCommandDto,
  UpdateSpeciesWikiCommandDto,
} from '@app/common/dtos/garden/species-wiki.dto';

@Controller()
export class SpeciesController {
  constructor(private readonly speciesService: SpeciesService) {}

  @GrpcCmd('get_all_species')
  getAllSpecies(@Payload() pagination: PaginationDto) {
    return this.speciesService.getAllSpecies(pagination);
  }

  @GrpcCmd('get_species_by_id')
  getSpeciesById(@Payload() id: UuidDto) {
    return this.speciesService.getSpeciesById(id.id);
  }

  @GrpcCmd('create_species')
  createSpecies(@Payload() payload: CreateSpeciesWikiCommandDto) {
    return this.speciesService.createSpecies(payload);
  }

  @GrpcCmd('update_species')
  updateSpecies(@Payload() payload: UpdateSpeciesWikiCommandDto) {
    const { id, ...data } = payload;
    return this.speciesService.updateSpecies(id, data);
  }

  @GrpcCmd('delete_species')
  deleteSpecies(@Payload() id: UuidDto) {
    return this.speciesService.deleteSpecies(id.id);
  }
}
