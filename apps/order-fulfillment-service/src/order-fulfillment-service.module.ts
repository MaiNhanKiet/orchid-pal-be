import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import {
  CommonModule,
  CustomValidationPipe,
  FitRpcExceptionFilter,
  LoggingInterceptor,
  TimeoutInterceptor,
} from '@app/common';
import { OrdersModule } from './orders/orders.module';
import { ShipmentsModule } from './shipments/shipments.module';
import { TransactionsModule } from './transactions/transactions.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PaymentModule } from './payment/payment.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BullConfigModule } from '@app/common/queue/bull-mq';
import { RedisModule } from '@app/redis';

@Module({
  imports: [
    CommonModule,
    RedisModule,
    BullConfigModule,
    OrdersModule,
    ShipmentsModule,
    TransactionsModule,
    EventEmitterModule.forRoot(),
    PaymentModule,
    DashboardModule,
  ],
  controllers: [],
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
export class OrderFulfillmentServiceModule {}
