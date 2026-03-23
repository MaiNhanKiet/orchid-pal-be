import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  DEVICE_REGISTRY_SERVICE_PORT,
  GARDEN_SERVICE_PORT,
  MQTT_BROKER_PASSWORD,
  MQTT_BROKER_URL,
  MQTT_BROKER_USERNAME,
  RmqModule,
} from '@app/common';
import { PrismaModule } from '@app/prisma';
import { MICROSERVICES_CLIENTS } from '@app/common/constants/microservice.constant';
import { AutomationServiceController } from './automation-service.controller';
import { AutomationServiceService } from './automation-service.service';
import { MongoModule } from '@app/mongo';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AutomationLog,
  AutomationLogSchema,
} from './schema/automation-log.schema';

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
        name: MICROSERVICES_CLIENTS.GARDEN_SERVICE,
        transport: Transport.TCP,
        options: {
          port: Number(GARDEN_SERVICE_PORT),
        },
      },
      {
        name: MICROSERVICES_CLIENTS.DEVICE_REGISTRY_SERVICE,
        transport: Transport.TCP,
        options: {
          port: Number(DEVICE_REGISTRY_SERVICE_PORT),
        },
      },
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
  ],
  controllers: [AutomationServiceController],
  providers: [AutomationServiceService],
})
export class AutomationServiceModule {}
