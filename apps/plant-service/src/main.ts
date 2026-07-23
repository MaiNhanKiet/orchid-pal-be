import 'dotenv/config';
import { RmqService } from '@app/common';
import { getGrpcServerOptions } from '@app/grpc';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  MQTT_BROKER_PASSWORD,
  MQTT_BROKER_URL,
  MQTT_BROKER_USERNAME,
  PLANT_SERVICE_PORT,
} from '@app/common/constants/env-key.constant';
import { PlantServiceModule } from './plant-service.module';

async function bootstrap() {
  const app = await NestFactory.create(PlantServiceModule);
  const rmqService = app.get<RmqService>(RmqService);

  app.connectMicroservice(
    getGrpcServerOptions(
      'plant',
      'plant.proto',
      `0.0.0.0:${PLANT_SERVICE_PORT}`,
    ),
  );

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
  await app.init();

  console.log(`[Plant Service]: gRPC running on port ${PLANT_SERVICE_PORT}`);
  console.log(`[Plant Service]: RabbitMQ listener on AUTOMATION_QUEUE`);
  console.log(`[Plant Service]: MQTT listening at ${MQTT_BROKER_URL}`);
}
bootstrap().catch((error) => {
  console.error('[Plant Service] Bootstrap failed:', error);
  process.exit(1);
});
