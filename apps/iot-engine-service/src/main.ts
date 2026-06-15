import 'dotenv/config';
import { RmqService } from '@app/common';
import { getGrpcServerOptions } from '@app/grpc';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  IOT_ENGINE_SERVICE_PORT,
  MQTT_BROKER_PASSWORD,
  MQTT_BROKER_URL,
  MQTT_BROKER_USERNAME,
} from '@app/common/constants/env-key.constant';
import { IotEngineServiceModule } from './iot-engine-service.module';

async function bootstrap() {
  const app = await NestFactory.create(IotEngineServiceModule);
  const rmqService = app.get<RmqService>(RmqService);

  app.connectMicroservice(
    getGrpcServerOptions(
      'iot',
      'iot.proto',
      `0.0.0.0:${IOT_ENGINE_SERVICE_PORT}`,
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

  console.log(
    `[IoT Engine Service]: gRPC running on port ${IOT_ENGINE_SERVICE_PORT}`,
  );
  console.log(`[IoT Engine Service]: RabbitMQ listener on AUTOMATION_QUEUE`);
  console.log(
    `[IoT Engine Service]: MQTT listening to Broker at ${MQTT_BROKER_URL}`,
  );
}
bootstrap().catch((error) => {
  console.error('[IoT Engine Service] Bootstrap failed:', error);
  process.exit(1);
});
