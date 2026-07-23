import {
  AllExceptionsFilter,
  AuthGuard,
  CommonModule,
  CustomValidationPipe,
  LoggingInterceptor,
  PermissionRbacGuard,
  QueueName,
  RmqModule,
  TimeoutInterceptor,
  TransformInterceptor,
} from '@app/common';
import { BullConfigModule } from '@app/common/queue/bull-mq';
import { GrpcRpcModule } from '@app/grpc';
import { RedisModule } from '@app/redis';
import { BullMQAdapter } from '@bull-board/api/dist/queueAdapters/bullMQ.js';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs/dist/bull-board.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { AutomationController } from './modules/automation/automation.controller';
import { AuthController } from './modules/auth/auth.controller';
import { GoogleStrategy } from './modules/auth/strategies/google.strategy';
import { DevicesModule } from './modules/devices/devices.module';
import { ExpertConsultationModule } from './expert-consultation/expert-consultation.module';
import { AiCareModule } from './ai-care/ai-care.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AdminModule } from './admin/admin.module';
import { AuditModule } from './audit/audit.module';
import { ExpertController } from './modules/expert/expert.controller';
import { PlantsController } from './modules/plants/plants.controller';
import { ProductsController } from './modules/products/product.controller';
import { RbacController } from './modules/rbac/rbac.controller';
import { TelemetryController } from './modules/telemetry/telemetry.controller';
import { UsersController } from './modules/users/users.controller';
import { UsersProfileController } from './modules/users/users-profile.controller';

@Module({
  imports: [
    CommonModule,
    PassportModule,
    RmqModule.register('AUTOMATION'),
    GrpcRpcModule,
    RedisModule,
    BullConfigModule,
    BullModule.registerQueue({ name: QueueName.IamCronQueue }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: QueueName.IamCronQueue,
      adapter: BullMQAdapter,
    }),
    EventEmitterModule.forRoot(),
    ExpertConsultationModule,
    DevicesModule,
    AiCareModule,
    FeedbackModule,
    AdminModule,
    AuditModule,
  ],
  controllers: [
    AuthController,
    UsersController,
    UsersProfileController,
    RbacController,
    ProductsController,
    PlantsController,
    TelemetryController,
    AutomationController,
    ExpertController,
  ],
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim() &&
    process.env.GOOGLE_CALLBACK_URL?.trim()
      ? [GoogleStrategy]
      : []),
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_PIPE, useClass: CustomValidationPipe },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionRbacGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
