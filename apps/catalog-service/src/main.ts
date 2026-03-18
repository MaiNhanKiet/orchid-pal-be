import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { CatalogModule } from './catalog-service.module';
import { CATALOG_SERVICE_PORT } from '@app/common/constants/env-key.constant';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CatalogModule,
    {
      transport: Transport.TCP,
      options: {
        port: Number(CATALOG_SERVICE_PORT),
      },
    },
  );
  await app.listen();
  console.log(
    `[Catalog Microservice]: running on port ${CATALOG_SERVICE_PORT}`,
  );
}
bootstrap();
