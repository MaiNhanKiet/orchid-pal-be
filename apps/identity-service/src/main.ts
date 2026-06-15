import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { IdentityServiceModule } from './identity-service.module';
import { IDENTITY_SERVICE_PORT } from '@app/common/constants/env-key.constant';
import { getGrpcServerOptions } from '@app/grpc';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(
    IdentityServiceModule,
    getGrpcServerOptions(
      'identity',
      'identity.proto',
      `0.0.0.0:${IDENTITY_SERVICE_PORT}`,
    ),
  );
  await app.listen();
  console.log(
    `[Identity Service]: gRPC running on port ${IDENTITY_SERVICE_PORT}`,
  );
}
bootstrap();
