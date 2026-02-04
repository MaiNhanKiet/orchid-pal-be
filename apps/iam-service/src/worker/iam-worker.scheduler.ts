import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName, ScheduleId } from '@app/common';

@Injectable()
export class IamWorkerScheduler implements OnModuleInit {
  constructor(
    @InjectQueue(QueueName.IamCronQueue) private iamCronQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.iamCronQueue.upsertJobScheduler(
      ScheduleId.CleanExpiredToken,
      { pattern: '0 0 * * *' },
      {
        name: ScheduleId.CleanExpiredToken,
        opts: { removeOnComplete: true },
      },
    );

    await this.iamCronQueue.upsertJobScheduler(
      ScheduleId.LogEvery1Min,
      { pattern: '*/1 * * * *' },
      {
        name: ScheduleId.LogEvery1Min,
        data: { message: 'Hello World' },
        opts: { removeOnComplete: true },
      },
    );

    console.log(
      '✅ [Scheduler] Đã khởi tạo toàn bộ lịch chạy cho IAM Service.',
    );
  }
}
