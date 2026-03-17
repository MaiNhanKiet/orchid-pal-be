import {
  CommonModule,
  CustomValidationPipe,
  FitRpcExceptionFilter,
  LoggingInterceptor,
  RmqModule,
  TimeoutInterceptor,
} from '@app/common';
import { MongoModule } from '@app/mongo';
import { PrismaModule } from '@app/prisma';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { Telemetry, TelemetrySchema } from './schemas/telemetry.schema';
import { TelemetryServiceController } from './telemetry-service.controller';
import { TelemetryServiceService } from './telemetry-service.service';

@Module({
  imports: [
    CommonModule,
    MongoModule,
    PrismaModule,
    MongooseModule.forFeature([
      { name: Telemetry.name, schema: TelemetrySchema },
    ]),
    RmqModule.register('API_GATEWAY'),
  ],
  controllers: [TelemetryServiceController],
  providers: [
    TelemetryServiceService,
    {
      provide: APP_FILTER,
      useClass: FitRpcExceptionFilter,
    },
    {
      provide: APP_PIPE,
      useClass: CustomValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
  ],
})
export class TelemetryServiceModule {}
