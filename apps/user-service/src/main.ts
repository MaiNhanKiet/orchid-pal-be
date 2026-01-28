import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UserServiceModule } from './user-service.module';
import { USER_SERVICE_PORT } from '@app/common/constants/env-key.constant';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserServiceModule,
    {
      transport: Transport.TCP,
      options: {
        port: Number(USER_SERVICE_PORT),
      },
    },
  );
  await app.listen();
  console.log(`[User Microservice]: running on port ${USER_SERVICE_PORT}`);
}
bootstrap();
