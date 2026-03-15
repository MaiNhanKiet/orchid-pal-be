import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  MQTT_BROKER_PASSWORD,
  MQTT_BROKER_URL,
  MQTT_BROKER_USERNAME,
  TELEMETRY_SERVICE_PORT,
} from '@app/common/constants/env-key.constant';
import { TelemetryServiceModule } from './telemetry-service.module';

async function bootstrap() {
  const app = await NestFactory.create(TelemetryServiceModule);
  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.TCP,
      options: {
        port: Number(TELEMETRY_SERVICE_PORT),
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

  console.log(`[Telemetry]: TCP running on port ${TELEMETRY_SERVICE_PORT}`);
  console.log(`[Telemetry]: MQTT listening to Broker at ${MQTT_BROKER_URL}`);
}
bootstrap();
