import { PrismaModule } from '@app/prisma';
import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatRateLimitService } from './chat-rate-limit.service';
import { CloudinaryService } from './cloudinary.service';
import { ExpertConsultationController } from './expert-consultation.controller';
import { ExpertConsultationService } from './expert-consultation.service';
import { ConsultationArchiveScheduler } from './consultation-archive.scheduler';
import {
  ConsultationRealtimeService,
  NotificationService,
} from './notification.service';

@Module({
  imports: [PrismaModule],
  controllers: [ExpertConsultationController],
  providers: [
    ExpertConsultationService,
    ConsultationArchiveScheduler,
    ChatGateway,
    ChatRateLimitService,
    CloudinaryService,
    ConsultationRealtimeService,
    NotificationService,
  ],
  exports: [ExpertConsultationService, NotificationService, CloudinaryService],
})
export class ExpertConsultationModule {}
