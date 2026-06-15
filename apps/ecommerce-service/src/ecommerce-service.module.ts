import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import {
  CommonModule,
  CustomValidationPipe,
  FitRpcExceptionFilter,
  LoggingInterceptor,
  TimeoutInterceptor,
} from '@app/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullConfigModule } from '@app/common/queue/bull-mq';
import { RedisModule } from '@app/redis';
import { GrpcCoreModule, GrpcRpcModule } from '@app/grpc';
import { ProductsModule } from './products/products.module';
import { CartsModule } from './carts/carts.module';
import { OrdersModule } from './orders/orders.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PaymentModule } from './payment/payment.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EcommerceGrpcController } from './grpc/ecommerce-grpc.controller';

@Module({
  imports: [
    CommonModule,
    GrpcCoreModule.forService(),
    GrpcRpcModule,
    RedisModule,
    BullConfigModule,
    EventEmitterModule.forRoot(),
    ProductsModule,
    CartsModule,
    OrdersModule,
    ShipmentsModule,
    TransactionsModule,
    PaymentModule,
    DashboardModule,
  ],
  controllers: [EcommerceGrpcController],
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
export class EcommerceServiceModule {}
