import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { GrpcCommandRegistry } from './grpc-command.registry';

@Module({})
export class GrpcCoreModule {
  static forService(): DynamicModule {
    return {
      module: GrpcCoreModule,
      imports: [DiscoveryModule],
      providers: [GrpcCommandRegistry],
      exports: [GrpcCommandRegistry],
    };
  }
}
