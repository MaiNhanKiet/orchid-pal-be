import { Module } from '@nestjs/common';
import { RefundReturnGatewayController } from './refund-return.controller';
import { MICROSERVICES_CLIENTS } from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ORDER_FULFILLMENT_SERVICE_PORT } from '@app/common/constants/env-key.constant';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: MICROSERVICES_CLIENTS.ORDER_FULFILLMENT_SERVICE,
        transport: Transport.TCP,
        options: {
          port: Number(ORDER_FULFILLMENT_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [RefundReturnGatewayController],
})
export class RefundReturnModule {}
