import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { BullModule } from '@nestjs/bullmq';
import { PaymentTimeoutProcessor } from './payment-timeout.processor';
import { MICROSERVICES_CLIENTS } from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ORDER_FULFILLMENT_SERVICE_PORT } from '@app/common/constants/env-key.constant';

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
    ]),
    BullModule.registerQueue({
      name: 'payment_timeout',
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentTimeoutProcessor],
  exports: [PaymentService],
})
export class PaymentModule {}
