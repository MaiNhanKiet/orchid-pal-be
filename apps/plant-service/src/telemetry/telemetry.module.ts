import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoModule } from '@app/mongo';
import { PrismaModule } from '@app/prisma';
import { RmqModule } from '@app/common';
import { Telemetry, TelemetrySchema } from '../schemas/telemetry.schema';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';

@Module({
  imports: [
    MongoModule,
    PrismaModule,
    RmqModule.register('API_GATEWAY'),
    MongooseModule.forFeature([{ name: Telemetry.name, schema: TelemetrySchema }]),
  ],
  controllers: [TelemetryController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
