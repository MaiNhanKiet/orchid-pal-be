import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName, ScheduleId } from '@app/common';

@Injectable()
export class IamWorkerScheduler implements OnModuleInit {
  constructor(
    @InjectQueue(QueueName.IamCronQueue) private iamCronQueue: Queue,
  ) { }

  async onModuleInit() {
    await this.iamCronQueue.upsertJobScheduler(
      ScheduleId.CleanExpiredToken,
      { pattern: '0 0 * * *' },
      {
        name: ScheduleId.CleanExpiredToken,
        opts: { removeOnComplete: true },
      },
    );

    console.log(
      '✅ [Scheduler] Đã khởi tạo toàn bộ lịch chạy cho IAM Service.',
    );
  }
}
