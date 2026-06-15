import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async sendEmail(payload: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    this.logger.log(`[Notification] Email queued to ${payload.to}: ${payload.subject}`);
  }

  async sendPush(payload: {
    userId: string;
    title: string;
    body: string;
  }): Promise<void> {
    this.logger.log(
      `[Notification] Push to user ${payload.userId}: ${payload.title}`,
    );
  }
}
