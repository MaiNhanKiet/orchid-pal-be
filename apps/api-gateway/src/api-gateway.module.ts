import { Module } from '@nestjs/common';
import {
  AllExceptionsFilter,
  AuthGuard,
  CommonModule,
  CustomValidationPipe,
  LoggingInterceptor,
  MICROSERVICES_CLIENTS,
  PermissionRbacGuard,
  QueueName,
  TimeoutInterceptor,
  TransformInterceptor,
} from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  CATALOG_SERVICE_PORT,
  IAM_SERVICE_PORT,
  ORDER_FULFILLMENT_SERVICE_PORT,
} from '@app/common/constants/env-key.constant';
import { AuthController } from './modules/auth/auth.controller';
import { GoogleStrategy } from './modules/auth/strategies/google.strategy';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { UsersController } from './modules/users/users.controller';
import { RbacController } from './modules/rbac/rbac.controller';
import { ProductsController } from './modules/products/product.controller';
import { CartsController } from './modules/carts/cart.controller';
import { RedisModule } from '@app/redis';
import { BullConfigModule } from '@app/common/queue/bull-mq';
import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs/dist/bull-board.module';
import { BullModule } from '@nestjs/bullmq';
import { BullMQAdapter } from '@bull-board/api/dist/queueAdapters/bullMQ.js';
import { OrdersController } from './modules/orders/order.controller';
import { ShipmentsController } from './modules/shipments/shipment.controller';
import { TransactionsController } from './modules/transactions/transaction.controller';
import { PaymentController } from './modules/payment/payment.controller';
import { AddressesController } from './modules/shipments/address.controller';

@Module({
  imports: [
    CommonModule,
    PassportModule,
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
        name: MICROSERVICES_CLIENTS.ORDER_FULFILLMENT_SERVICE,
        transport: Transport.TCP,
        options: {
          port: Number(ORDER_FULFILLMENT_SERVICE_PORT),
        },
      },
    ]),
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
  ],
  controllers: [
    AuthController,
    UsersController,
    RbacController,
    ProductsController,
    CartsController,
    OrdersController,
    ShipmentsController,
    TransactionsController,
    PaymentController,
    AddressesController,
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
