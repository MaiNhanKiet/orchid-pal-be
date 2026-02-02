import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { OrderFulfillmentServiceModule } from './order-fulfillment-service.module';
import { ORDER_FULFILLMENT_SERVICE_PORT } from '@app/common/constants/env-key.constant';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrderFulfillmentServiceModule,
    {
      transport: Transport.TCP,
      options: {
        port: Number(ORDER_FULFILLMENT_SERVICE_PORT),
      },
    },
  );
  await app.listen();
  console.log(`[Order Fulfillment Microservice]: running on port ${ORDER_FULFILLMENT_SERVICE_PORT}`);
}
bootstrap();
