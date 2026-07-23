import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import {
  CommonModule,
  CustomValidationPipe,
  FitRpcExceptionFilter,
  LoggingInterceptor,
  TimeoutInterceptor,
} from '@app/common';
import { GrpcCoreModule } from '@app/grpc';
import { PlantGrpcController } from './grpc/plant-grpc.controller';
import { ProductsModule } from './products/products.module';
import { PlantsModule } from './plants/plants.module';
import { DevicesModule } from './devices/devices.module';
import { AutomationModule } from './automation/automation.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { VisionModule } from './vision/vision.module';
import { ExpertModule } from './expert/expert.module';
import { FirmwareModule } from './firmware/firmware.module';

@Module({
  imports: [
    CommonModule,
    GrpcCoreModule.forService(),
    EventEmitterModule.forRoot(),
    ProductsModule,
    PlantsModule,
    DevicesModule,
    AutomationModule,
    TelemetryModule,
    VisionModule,
    ExpertModule,
    FirmwareModule,
  ],
  controllers: [PlantGrpcController],
  providers: [
    { provide: APP_FILTER, useClass: FitRpcExceptionFilter },
    { provide: APP_PIPE, useClass: CustomValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
  ],
})
export class PlantServiceModule {}
