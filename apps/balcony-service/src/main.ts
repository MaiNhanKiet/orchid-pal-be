import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { BalconyServiceModule } from './balcony-service.module';
import { BALCONY_SERVICE_PORT } from '@app/common/constants/env-key.constant';
import { getGrpcServerOptions } from '@app/grpc';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(
    BalconyServiceModule,
    getGrpcServerOptions(
      'balcony',
      'balcony.proto',
      `0.0.0.0:${BALCONY_SERVICE_PORT}`,
    ),
  );
  await app.listen();
  console.log(
    `[Balcony Service]: gRPC running on port ${BALCONY_SERVICE_PORT}`,
  );
}
bootstrap();
