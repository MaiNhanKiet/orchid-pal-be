import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { EcommerceServiceModule } from './ecommerce-service.module';
import { ECOMMERCE_SERVICE_PORT } from '@app/common/constants/env-key.constant';
import { getGrpcServerOptions } from '@app/grpc';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(
    EcommerceServiceModule,
    getGrpcServerOptions(
      'ecommerce',
      'ecommerce.proto',
      `0.0.0.0:${ECOMMERCE_SERVICE_PORT}`,
    ),
  );
  await app.listen();
  console.log(
    `[Ecommerce Service]: gRPC running on port ${ECOMMERCE_SERVICE_PORT}`,
  );
}
bootstrap();
