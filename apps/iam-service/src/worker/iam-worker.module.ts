import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IamWorkerService } from './iam-worker.service';
import { TokenCleanupProcessor } from './processor/token-cleanup.processor';
import { IamWorkerScheduler } from './iam-worker.scheduler';
import { BullConfigModule } from '@app/common/queue/bull-mq';
import { QueueName } from '@app/common';

@Module({
  imports: [
    BullConfigModule,
    BullModule.registerQueue({
      name: QueueName.IamCronQueue,
    }),
  ],
  providers: [
    IamWorkerService,
    IamWorkerScheduler,
    TokenCleanupProcessor,
  ],
  exports: [IamWorkerService],
})
export class IamWorkerModule { }
