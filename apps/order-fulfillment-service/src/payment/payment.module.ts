import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { BullModule } from '@nestjs/bullmq';
import { PaymentTimeoutProcessor } from './payment-timeout.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'payment_timeout',
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentTimeoutProcessor],
  exports: [PaymentService],
})
export class PaymentModule {}
