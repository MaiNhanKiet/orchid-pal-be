import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  MQTT_BROKER_PASSWORD,
  MQTT_BROKER_URL,
  MQTT_BROKER_USERNAME,
} from '@app/common/constants/env-key.constant';
import { RmqService } from '@app/common';
import { AutomationServiceModule } from './automation-service.module';

async function bootstrap() {
  const app = await NestFactory.create(AutomationServiceModule);
  const rmqService = app.get<RmqService>(RmqService);

  app.connectMicroservice(rmqService.getOptions('AUTOMATION', false));

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.MQTT,
      options: {
        url: MQTT_BROKER_URL,
        username: MQTT_BROKER_USERNAME,
        password: MQTT_BROKER_PASSWORD,
      },
    },
    { inheritAppConfig: true },
  );

  await app.startAllMicroservices();
  console.log(`[Automation Microservice]: running on RabbitMQ Queue`);
  console.log(
    `[Automation Microservice]: MQTT listening to Broker at ${MQTT_BROKER_URL}`,
  );
}
bootstrap();
