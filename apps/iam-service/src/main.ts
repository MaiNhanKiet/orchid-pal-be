import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { IAmModule } from './iam-service.module';
import { IAM_SERVICE_PORT } from '@app/common/constants/env-key.constant';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    IAmModule,
    {
      transport: Transport.TCP,
      options: {
        port: Number(IAM_SERVICE_PORT),
      },
    },
  );
  await app.listen();
  console.log(`[IAM Microservice]: running on port ${IAM_SERVICE_PORT}`);
}
bootstrap();
