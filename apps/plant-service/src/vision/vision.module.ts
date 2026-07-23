import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { PlantsModule } from '../plants/plants.module';
import { VisionController } from './vision.controller';
import { VisionService } from './vision.service';

@Module({
  imports: [PrismaModule, PlantsModule],
  controllers: [VisionController],
  providers: [VisionService],
})
export class VisionModule {}
