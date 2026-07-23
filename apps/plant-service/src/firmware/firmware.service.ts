import { PrismaService } from '@app/prisma';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FirmwareService {
  constructor(private readonly prisma: PrismaService) {}

  listVersions() {
    return this.prisma.firmware_versions.findMany({ orderBy: { created_at: 'desc' } });
  }

  createVersion(data: {
    version: string;
    file_url: string;
    release_notes?: string;
    is_mandatory?: boolean;
  }) {
    return this.prisma.firmware_versions.create({ data });
  }
}
