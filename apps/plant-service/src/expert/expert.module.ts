import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { ExpertController } from './expert.controller';
import { ExpertService } from './expert.service';

@Module({
  imports: [PrismaModule],
  controllers: [ExpertController],
  providers: [ExpertService],
})
export class ExpertModule {}
