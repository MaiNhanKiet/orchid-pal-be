import { Module } from '@nestjs/common';
import { BalconyZonesController } from './zones.controller';
import { BalconyZonesService } from './zones.service';
import { PrismaModule } from '@app/prisma';

@Module({
  imports: [PrismaModule],
  controllers: [BalconyZonesController],
  providers: [BalconyZonesService],
})
export class BalconyZonesModule {}
