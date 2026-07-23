import { PrismaModule } from '@app/prisma';
import { Module } from '@nestjs/common';
import { CloudinaryService } from '../expert-consultation/cloudinary.service';
import { AiCareController } from './ai-care.controller';
import { AiCareSessionController } from './ai-care-session.controller';
import { AiCareService } from './ai-care.service';
import { GeminiChatService } from './gemini-chat.service';

@Module({
  imports: [PrismaModule],
  controllers: [AiCareController, AiCareSessionController],
  providers: [AiCareService, GeminiChatService, CloudinaryService],
})
export class AiCareModule {}
