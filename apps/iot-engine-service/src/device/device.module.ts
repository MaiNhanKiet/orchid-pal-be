import { Module } from '@nestjs/common';
import { RmqModule } from '@app/common';
import { PrismaModule } from '@app/prisma';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';

@Module({
  imports: [PrismaModule, RmqModule.register('AUTOMATION')],
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class DeviceModule {}
