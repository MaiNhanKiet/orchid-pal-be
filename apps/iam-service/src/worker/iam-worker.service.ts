import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName, ScheduleId } from '@app/common';

@Injectable()
export class IamWorkerService {
  constructor(
    @InjectQueue(QueueName.IamCronQueue) private iamCronQueue: Queue,
  ) {}

  async updateLogSchedule(cronPattern: string, message: string) {
    const schedulerId = 'log-dynamic-scheduler';

    await this.iamCronQueue.upsertJobScheduler(
      schedulerId,
      {
        pattern: cronPattern,
      },
      {
        name: ScheduleId.LogEvery1Min,
        data: { message: message },
        opts: { removeOnComplete: true },
      },
    );
  }
}
