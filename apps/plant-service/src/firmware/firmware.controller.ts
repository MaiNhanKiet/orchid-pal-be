import { GrpcCmd } from '@app/grpc';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { FirmwareService } from './firmware.service';

@Controller()
export class FirmwareController {
  constructor(private readonly firmwareService: FirmwareService) {}

  @GrpcCmd('list_firmware_versions')
  listVersions() {
    return this.firmwareService.listVersions();
  }

  @GrpcCmd('create_firmware_version')
  createVersion(
    @Payload()
    data: {
      version: string;
      file_url: string;
      release_notes?: string;
      is_mandatory?: boolean;
    },
  ) {
    return this.firmwareService.createVersion(data);
  }
}
