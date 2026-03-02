import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QueueName, ScheduleId } from '@app/common';

@Injectable()
export class IamWorkerService {
  constructor(
    @InjectQueue(QueueName.IamCronQueue) private iamCronQueue: Queue,
  ) { }

}
