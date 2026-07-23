import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { FirmwareController } from './firmware.controller';
import { FirmwareService } from './firmware.service';

@Module({
  imports: [PrismaModule],
  controllers: [FirmwareController],
  providers: [FirmwareService],
})
export class FirmwareModule {}
