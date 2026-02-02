import { Module } from '@nestjs/common';
import {
  AllExceptionsFilter,
  AuthGuard,
  CommonModule,
  CustomValidationPipe,
  LoggingInterceptor,
  MICROSERVICES_CLIENTS,
  PermissionRbacGuard,
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
import { OrdersController } from './modules/orders/order.controller';
import { ShipmentsController } from './modules/shipments/shipment.controller';
import { TransactionsController } from './modules/transactions/transaction.controller';

@Module({
  imports: [
    CommonModule,
    PassportModule,
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
  ],
  controllers: [
    AuthController,
    UsersController,
    RbacController,
    ProductsController,
    CartsController,
    OrdersController,
    ShipmentsController,
    TransactionsController
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
