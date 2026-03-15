import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DeviceRegistryServiceModule } from './device-registry-service.module';
import {
  DEVICE_REGISTRY_SERVICE_PORT,
  MQTT_BROKER_PASSWORD,
  MQTT_BROKER_URL,
  MQTT_BROKER_USERNAME,
} from '@app/common/constants/env-key.constant';

async function bootstrap() {
  const app = await NestFactory.create(DeviceRegistryServiceModule);

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.TCP,
      options: {
        port: Number(DEVICE_REGISTRY_SERVICE_PORT),
      },
    },
    { inheritAppConfig: true },
  );

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
    `[Device Registry]: TCP running on port ${DEVICE_REGISTRY_SERVICE_PORT}`,
  );
  console.log(
    `[Device Registry]: MQTT listening to Broker at ${MQTT_BROKER_URL}`,
  );
}
bootstrap();
