import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoModule } from '@app/mongo';
import { PrismaModule } from '@app/prisma';
import { RmqModule } from '@app/common';
import { Message, MessageSchema } from '../schemas/message.telemetry';
import { Telemetry, TelemetrySchema } from '../schemas/telemetry.schema';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [
    MongoModule,
    PrismaModule,
    RmqModule.register('API_GATEWAY'),
    HttpModule,
    MongooseModule.forFeature([
      { name: Telemetry.name, schema: TelemetrySchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    forwardRef(() => AutomationModule),
  ],
  controllers: [TelemetryController],
  providers: [TelemetryService],
  exports: [TelemetryService],
})
export class TelemetryModule {}
