import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';
import { GRPC_CMD_KEY } from './decorators/grpc-cmd.decorator';

@Injectable()
export class GrpcCommandRegistry implements OnApplicationBootstrap {
  private readonly logger = new Logger(GrpcCommandRegistry.name);
  private readonly handlers = new Map<
    string,
    (payload: unknown) => Promise<unknown> | unknown
  >();

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  onApplicationBootstrap() {
    const wrappers = [
      ...this.discovery.getProviders(),
      ...this.discovery.getControllers(),
    ];

    for (const wrapper of wrappers) {
      this.registerInstance(wrapper.instance);
    }

    const cmds = [...this.handlers.keys()].sort();
    this.logger.log(`Registered ${cmds.length} gRPC command(s): ${cmds.join(', ')}`);
  }

  private registerInstance(instance: unknown) {
    if (!instance || typeof instance !== 'object') return;

    const prototype = Object.getPrototypeOf(instance);
    if (!prototype) return;

    for (const methodName of this.metadataScanner.getAllMethodNames(prototype)) {
      const method = prototype[methodName];
      if (typeof method !== 'function') continue;

      const cmd = this.reflector.get<string>(GRPC_CMD_KEY, method);
      if (!cmd) continue;

      this.handlers.set(cmd, method.bind(instance));
    }
  }

  async invoke(cmd: string, payload: unknown) {
    const handler = this.handlers.get(cmd);
    if (!handler) {
      throw new RpcException(`Unknown gRPC command: ${cmd}`);
    }

    return handler(payload);
  }
}
