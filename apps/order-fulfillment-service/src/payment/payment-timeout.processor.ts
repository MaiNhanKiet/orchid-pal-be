import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PaymentService } from './payment.service';

import { QueueName } from '@app/common';

@Processor(QueueName.PaymentTimeoutQueue)
export class PaymentTimeoutProcessor extends WorkerHost {
  constructor(private readonly paymentService: PaymentService) {
    super();
  }

  async process(job: Job<{ transactionId: string }>) {
    const { transactionId } = job.data;
    console.log(
      `[PaymentTimeoutProcessor] Processing job for transaction: ${transactionId}`,
    );

    try {
      await this.paymentService.handleTimeoutPayment(transactionId);
    } catch (error) {
      console.error(
        `[PaymentTimeoutProcessor] Error processing transaction ${transactionId}:`,
        error,
      );
      throw error;
    }
  }
}
