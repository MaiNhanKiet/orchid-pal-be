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
import { CartsController } from './modules/carts/cart.controller';
import { DashboardController } from './modules/dashboard/dashboard.controller';
import { DevicesController } from './modules/devices/devices.controller';
import { MyPlantsController } from './modules/garden/my-plants/my-plants.controller';
import { PlantWikiController } from './modules/garden/species/plant-wiki.controller';
import { ZonesController } from './modules/garden/zones/zones.controller';
import { OrdersController } from './modules/orders/order.controller';
import { PaymentController } from './modules/payment/payment.controller';
import { ProductsController } from './modules/products/product.controller';
import { RbacController } from './modules/rbac/rbac.controller';
import { AddressesController } from './modules/shipments/address.controller';
import { ShipmentsController } from './modules/shipments/shipment.controller';
import { TelemetryController } from './modules/telemetry/telemetry.controller';
import { TransactionsController } from './modules/transactions/transaction.controller';
import { UsersController } from './modules/users/users.controller';
import { ChatController } from './modules/chat/chat.controller';

@Module({
  imports: [
    CommonModule,
    PassportModule,
    RmqModule.register('AUTOMATION'),
    GrpcRpcModule,
    RedisModule,
    BullConfigModule,
    BullModule.registerQueue({ name: QueueName.IamCronQueue }),
    BullModule.registerQueue({ name: QueueName.PaymentTimeoutQueue }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature(
      {
        name: QueueName.IamCronQueue,
        adapter: BullMQAdapter,
      },
      {
        name: QueueName.PaymentTimeoutQueue,
        adapter: BullMQAdapter,
      },
    ),
    EventEmitterModule.forRoot(),
  ],
  controllers: [
    AuthController,
    UsersController,
    RbacController,
    ProductsController,
    CartsController,
    PlantWikiController,
    ZonesController,
    MyPlantsController,
    AutomationController,
    DevicesController,
    TelemetryController,
    OrdersController,
    ShipmentsController,
    TransactionsController,
    PaymentController,
    AddressesController,
    DashboardController,
    ChatController,
  ],
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID?.trim() &&
    process.env.GOOGLE_CLIENT_SECRET?.trim() &&
    process.env.GOOGLE_CALLBACK_URL?.trim()
      ? [GoogleStrategy]
      : []),
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_PIPE,
      useClass: CustomValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionRbacGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
