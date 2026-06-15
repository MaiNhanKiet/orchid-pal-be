import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import {
  CommonModule,
  CustomValidationPipe,
  FitRpcExceptionFilter,
  LoggingInterceptor,
  TimeoutInterceptor,
} from '@app/common';
import { GrpcCoreModule } from '@app/grpc';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RbacModule } from './rbac/rbac.module';
import { IamWorkerModule } from './worker/iam-worker.module';
import { NotificationModule } from './notification/notification.module';
import { IdentityGrpcController } from './grpc/identity-grpc.controller';

@Module({
  imports: [
    CommonModule,
    GrpcCoreModule.forService(),
    AuthModule,
    UsersModule,
    RbacModule,
    IamWorkerModule,
    NotificationModule,
  ],
  controllers: [IdentityGrpcController],
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
export class IdentityServiceModule {}
