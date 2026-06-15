import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { BullModule } from '@nestjs/bullmq';
import { MICROSERVICES_CLIENTS, QueueName, RmqModule } from '@app/common';
import { PaymentTimeoutProcessor } from './payment-timeout.processor';
import { GhnService } from '../shipments/ghn.service';

@Module({
  imports: [
    RmqModule.register(MICROSERVICES_CLIENTS.API_GATEWAY),
    BullModule.registerQueue({
      name: QueueName.PaymentTimeoutQueue,
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentTimeoutProcessor, GhnService],
  exports: [PaymentService],
})
export class PaymentModule {}
