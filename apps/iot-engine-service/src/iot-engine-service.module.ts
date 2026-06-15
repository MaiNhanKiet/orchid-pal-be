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
import { GrpcCoreModule, GrpcRpcModule } from '@app/grpc';
import { DeviceModule } from './device/device.module';
import { AutomationModule } from './automation/automation.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { IotEngineGrpcController } from './grpc/iot-engine-grpc.controller';

@Module({
  imports: [
    CommonModule,
    GrpcCoreModule.forService(),
    GrpcRpcModule,
    EventEmitterModule.forRoot(),
    DeviceModule,
    AutomationModule,
    TelemetryModule,
  ],
  controllers: [IotEngineGrpcController],
  providers: [
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
export class IotEngineServiceModule {}
