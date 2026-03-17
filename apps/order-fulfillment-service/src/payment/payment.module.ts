import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { BullModule } from '@nestjs/bullmq';
import { PaymentTimeoutProcessor } from './payment-timeout.processor';
import { MICROSERVICES_CLIENTS, QueueName, RmqModule } from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ORDER_FULFILLMENT_SERVICE_PORT, API_GATEWAY_PORT } from '@app/common/constants/env-key.constant';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: MICROSERVICES_CLIENTS.ORDER_FULFILLMENT_SERVICE,
        transport: Transport.TCP,
        options: {
          port: Number(ORDER_FULFILLMENT_SERVICE_PORT),
        },
      },
      {
        name: MICROSERVICES_CLIENTS.API_GATEWAY,
        transport: Transport.TCP,
        options: {
          port: Number(API_GATEWAY_PORT),
        },
      },
    ]),
    RmqModule.register(MICROSERVICES_CLIENTS.API_GATEWAY),
    BullModule.registerQueue({
      name: QueueName.PaymentTimeoutQueue,
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentTimeoutProcessor],
  exports: [PaymentService],
})
export class PaymentModule {}
