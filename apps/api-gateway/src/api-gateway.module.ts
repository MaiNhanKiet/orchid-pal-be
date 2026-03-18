import {
  AllExceptionsFilter,
  AuthGuard,
  CommonModule,
  CustomValidationPipe,
  LoggingInterceptor,
  MICROSERVICES_CLIENTS,
  PermissionRbacGuard,
  QueueName,
  RmqModule,
  TimeoutInterceptor,
  TransformInterceptor,
} from '@app/common';
import {
  CATALOG_SERVICE_PORT,
  DEVICE_REGISTRY_SERVICE_PORT,
  GARDEN_SERVICE_PORT,
  IAM_SERVICE_PORT,
  TELEMETRY_SERVICE_PORT,
  ORDER_FULFILLMENT_SERVICE_PORT,
} from '@app/common/constants/env-key.constant';
import { BullConfigModule } from '@app/common/queue/bull-mq';
import { RedisModule } from '@app/redis';
import { BullMQAdapter } from '@bull-board/api/dist/queueAdapters/bullMQ.js';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs/dist/bull-board.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './modules/auth/auth.controller';
import { GoogleStrategy } from './modules/auth/strategies/google.strategy';
import { CartsController } from './modules/carts/cart.controller';
import { AdminDevicesController } from './modules/devices/admin-devices.controller';
import { DevicesController } from './modules/devices/devices.controller';
import { MyPlantsController } from './modules/garden/my-plants/my-plants.controller';
import { AdminSpeciesController } from './modules/garden/species/admin-species.controller';
import { SpeciesController } from './modules/garden/species/species.controller';
import { ZonesController } from './modules/garden/zones/zones.controller';
import { ProductsController } from './modules/products/product.controller';
import { RbacController } from './modules/rbac/rbac.controller';
import { TelemetryController } from './modules/telemetry/telemetry.controller';
import { UsersController } from './modules/users/users.controller';
import { OrdersController } from './modules/orders/order.controller';
import { ShipmentsController } from './modules/shipments/shipment.controller';
import { TransactionsController } from './modules/transactions/transaction.controller';
import { PaymentController } from './modules/payment/payment.controller';
import { AddressesController } from './modules/shipments/address.controller';
import { DashboardController } from './modules/dashboard/dashboard.controller';

@Module({
  imports: [
    CommonModule,
    PassportModule,
    RmqModule.register('AUTOMATION'),
    RedisModule,
    ClientsModule.register([
      {
        name: MICROSERVICES_CLIENTS.IAM_SERVICE,
        transport: Transport.TCP,
        options: {
          port: Number(IAM_SERVICE_PORT),
        },
      },
      {
        name: MICROSERVICES_CLIENTS.CATALOG_SERVICE,
        transport: Transport.TCP,
        options: {
          port: Number(CATALOG_SERVICE_PORT),
        },
      },
      {
        name: MICROSERVICES_CLIENTS.GARDEN_SERVICE,
        transport: Transport.TCP,
        options: {
          port: Number(GARDEN_SERVICE_PORT),
        },
      },
      {
        name: MICROSERVICES_CLIENTS.DEVICE_REGISTRY_SERVICE,
        transport: Transport.TCP,
        options: {
          port: Number(DEVICE_REGISTRY_SERVICE_PORT),
        },
      },
      {
        name: MICROSERVICES_CLIENTS.TELEMETRY_SERVICE,
        transport: Transport.TCP,
        options: {
          port: Number(TELEMETRY_SERVICE_PORT),
        },
      },
      {
        name: MICROSERVICES_CLIENTS.ORDER_FULFILLMENT_SERVICE,
        transport: Transport.TCP,
        options: {
          port: Number(ORDER_FULFILLMENT_SERVICE_PORT),
        },
      },
    ]),
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
    SpeciesController,
    AdminSpeciesController,
    ZonesController,
    MyPlantsController,
    DevicesController,
    AdminDevicesController,
    TelemetryController,
    OrdersController,
    ShipmentsController,
    TransactionsController,
    PaymentController,
    AddressesController,
    DashboardController,
  ],
  providers: [
    GoogleStrategy,
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
