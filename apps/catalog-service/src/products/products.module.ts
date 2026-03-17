import { Module } from '@nestjs/common';
import { ProductsController  } from './products.controller';
import { ProductsService } from './products.service';
import {
  DEVICE_REGISTRY_SERVICE_PORT,
  MICROSERVICES_CLIENTS,
} from '@app/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: MICROSERVICES_CLIENTS.DEVICE_REGISTRY_SERVICE,
        transport: Transport.TCP,
        options: {
          port: Number(DEVICE_REGISTRY_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}