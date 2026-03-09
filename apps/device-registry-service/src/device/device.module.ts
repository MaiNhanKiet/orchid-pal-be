import { Module } from '@nestjs/common';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { PrismaModule } from '@app/prisma';
import { RmqModule } from '@app/common/queue/rabbit-mq/rmq.module';

@Module({
  imports: [PrismaModule, RmqModule.register('AUTOMATION')],
  controllers: [DeviceController],
  providers: [DeviceService],
})
export class DeviceModule {}
