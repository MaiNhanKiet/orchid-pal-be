import { MICROSERVICES_CLIENTS } from '@app/common';
import { GARDEN_SERVICE_PORT } from '@app/common/constants/env-key.constant';
import { RmqModule } from '@app/common/queue/rabbit-mq/rmq.module';
import { PrismaModule } from '@app/prisma';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';

@Module({
  imports: [
    PrismaModule,
    RmqModule.register('AUTOMATION'),
    ClientsModule.register([
      {
        name: MICROSERVICES_CLIENTS.GARDEN_SERVICE,
        transport: Transport.TCP,
        options: {
          port: Number(GARDEN_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [DeviceController],
  providers: [DeviceService],
})
export class DeviceModule {}
