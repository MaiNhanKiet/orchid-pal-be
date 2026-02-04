import { QueueName, ScheduleId } from '@app/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor(QueueName.IamCronQueue)
export class LogTestProcessor extends WorkerHost {
  async process(job: Job): Promise<any> {
    if (job.name === ScheduleId.LogEvery1Min) {
      console.log(
        `[${new Date().toISOString()}] 📢 Hello! Đã trôi qua 1 phút.`,
      );
    }
    return { result: 'done' };
  }
}
