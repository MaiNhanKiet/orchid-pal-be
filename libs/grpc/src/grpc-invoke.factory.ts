import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GrpcCommandRegistry } from './grpc-command.registry';

export function createGrpcInvokeController(
  serviceName: string,
): new (...args: unknown[]) => object {
  @Controller()
  class GrpcInvokeController {
    constructor(private readonly registry: GrpcCommandRegistry) {}

    @GrpcMethod(serviceName, 'Invoke')
    async invoke(data: { cmd?: string; payload?: string }) {
      const cmd = data?.cmd ?? '';
      const parsedPayload = data?.payload ? JSON.parse(data.payload) : {};

      const result = await this.registry.invoke(cmd, parsedPayload);

      return {
        payload: JSON.stringify(result ?? null),
      };
    }
  }

  return GrpcInvokeController;
}
