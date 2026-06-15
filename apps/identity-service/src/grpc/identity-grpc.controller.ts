import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { GrpcCommandRegistry, GRPC_SERVICE_NAMES } from '@app/grpc';

@Controller()
export class IdentityGrpcController {
  constructor(private readonly registry: GrpcCommandRegistry) {}

  @GrpcMethod(GRPC_SERVICE_NAMES.IDENTITY, 'Invoke')
  async invoke(data: { cmd?: string; payload?: string }) {
    const result = await this.registry.invoke(
      data?.cmd ?? '',
      data?.payload ? JSON.parse(data.payload) : {},
    );
    return { payload: JSON.stringify(result ?? null) };
  }
}
