import { MICROSERVICES_CLIENTS } from '@app/common';
import { Global, Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { getGrpcClientOptions } from './grpc.options';
import { GRPC_CLIENT_URLS, GrpcRpcService } from './grpc-rpc.service';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: MICROSERVICES_CLIENTS.IDENTITY_SERVICE,
        ...getGrpcClientOptions(
          'identity',
          'identity.proto',
          GRPC_CLIENT_URLS.identity(),
        ),
      },
      {
        name: MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE,
        ...getGrpcClientOptions(
          'ecommerce',
          'ecommerce.proto',
          GRPC_CLIENT_URLS.ecommerce(),
        ),
      },
      {
        name: MICROSERVICES_CLIENTS.BALCONY_SERVICE,
        ...getGrpcClientOptions(
          'balcony',
          'balcony.proto',
          GRPC_CLIENT_URLS.balcony(),
        ),
      },
      {
        name: MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
        ...getGrpcClientOptions(
          'iot',
          'iot.proto',
          GRPC_CLIENT_URLS.iot(),
        ),
      },
    ]),
  ],
  providers: [GrpcRpcService],
  exports: [GrpcRpcService, ClientsModule],
})
export class GrpcRpcModule {}
