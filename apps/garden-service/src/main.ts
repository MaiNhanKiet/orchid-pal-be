import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { GardenServiceModule } from './garden-service.module';
import { GARDEN_SERVICE_PORT } from '@app/common/constants/env-key.constant';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    GardenServiceModule,
    {
      transport: Transport.TCP,
      options: {
        port: Number(GARDEN_SERVICE_PORT),
      },
    },
  );

  await app.listen();
  console.log(`[Garden Microservice]: running on port ${GARDEN_SERVICE_PORT}`);
}
bootstrap();
