import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@app/prisma';
import { QueueName, ScheduleId } from '@app/common';

@Processor(QueueName.IamCronQueue)
export class TokenCleanupProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<any> {
    if (job.name === ScheduleId.CleanExpiredToken) {
      const result = await this.prisma.refresh_tokens.deleteMany({
        where: { expires_at: { lt: new Date() } },
      });
      return { deleted: result.count };
    }
  }
}
