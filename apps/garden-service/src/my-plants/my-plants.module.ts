import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { MyPlantsController } from './my-plants.controller';
import { MyPlantsService } from './my-plants.service';

@Module({
  imports: [PrismaModule],
  controllers: [MyPlantsController],
  providers: [MyPlantsService],
})
export class MyPlantsModule {}

