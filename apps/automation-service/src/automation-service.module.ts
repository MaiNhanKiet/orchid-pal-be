import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RmqModule } from '@app/common';
import { PrismaModule } from '@app/prisma';
import { MICROSERVICES_CLIENTS } from '@app/common/constants/microservice.constant';
import { AutomationServiceController } from './automation-service.controller';
import { AutomationServiceService } from './automation-service.service';

@Module({
  imports: [
    RmqModule,
    PrismaModule,
    ClientsModule.registerAsync([
      {
        name: MICROSERVICES_CLIENTS.GARDEN_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            port: Number(configService.get<string>('GARDEN_SERVICE_PORT')),
          },
        }),
      },
      {
        name: 'MQTT_CLIENT',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.MQTT,
          options: {
            url: configService.get<string>('MQTT_BROKER_URL'),
            username: configService.get<string>('MQTT_BROKER_USERNAME'),
            password: configService.get<string>('MQTT_BROKER_PASSWORD'),
          },
        }),
      },
    ]),
  ],
  controllers: [AutomationServiceController],
  providers: [AutomationServiceService],
})
export class AutomationServiceModule {}
