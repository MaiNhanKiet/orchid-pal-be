import { Module, forwardRef } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  MQTT_BROKER_PASSWORD,
  MQTT_BROKER_URL,
  MQTT_BROKER_USERNAME,
  RmqModule,
} from '@app/common';
import { PrismaModule } from '@app/prisma';
import { MongoModule } from '@app/mongo';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AutomationLog,
  AutomationLogSchema,
} from './schema/automation-log.schema';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { DeviceModule } from '../device/device.module';

@Module({
  imports: [
    RmqModule,
    PrismaModule,
    MongoModule,
    MongooseModule.forFeature([
      { name: AutomationLog.name, schema: AutomationLogSchema },
    ]),
    ClientsModule.register([
      {
        name: 'MQTT_CLIENT',
        transport: Transport.MQTT,
        options: {
          url: MQTT_BROKER_URL,
          username: MQTT_BROKER_USERNAME,
          password: MQTT_BROKER_PASSWORD,
        },
      },
    ]),
    forwardRef(() => DeviceModule),
  ],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
