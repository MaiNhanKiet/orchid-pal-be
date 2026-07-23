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
        name: MICROSERVICES_CLIENTS.PLANT_SERVICE,
        ...getGrpcClientOptions(
          'plant',
          'plant.proto',
          GRPC_CLIENT_URLS.plant(),
        ),
      },
    ]),
  ],
  providers: [GrpcRpcService],
  exports: [GrpcRpcService, ClientsModule],
})
export class GrpcRpcModule {}
