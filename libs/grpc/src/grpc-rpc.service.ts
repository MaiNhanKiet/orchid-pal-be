import { MICROSERVICES_CLIENTS } from '@app/common';
import {
  BALCONY_SERVICE_PORT,
  ECOMMERCE_SERVICE_PORT,
  IDENTITY_SERVICE_PORT,
  IOT_ENGINE_SERVICE_PORT,
} from '@app/common/constants/env-key.constant';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  GRPC_PACKAGES,
  GRPC_SERVICE_NAMES,
} from './grpc.options';

interface GrpcInvokeClient {
  invoke(data: { cmd: string; payload: string }): import('rxjs').Observable<{
    payload?: string;
  }>;
}

@Injectable()
export class GrpcRpcService implements OnModuleInit {
  private readonly services = new Map<string, GrpcInvokeClient>();

  constructor(
    @Inject(MICROSERVICES_CLIENTS.IDENTITY_SERVICE)
    private readonly identityClient: ClientGrpc,
    @Inject(MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE)
    private readonly ecommerceClient: ClientGrpc,
    @Inject(MICROSERVICES_CLIENTS.BALCONY_SERVICE)
    private readonly balconyClient: ClientGrpc,
    @Inject(MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE)
    private readonly iotClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.services.set(
      MICROSERVICES_CLIENTS.IDENTITY_SERVICE,
      this.identityClient.getService<GrpcInvokeClient>(
        GRPC_SERVICE_NAMES.IDENTITY,
      ),
    );
    this.services.set(
      MICROSERVICES_CLIENTS.ECOMMERCE_SERVICE,
      this.ecommerceClient.getService<GrpcInvokeClient>(
        GRPC_SERVICE_NAMES.ECOMMERCE,
      ),
    );
    this.services.set(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      this.balconyClient.getService<GrpcInvokeClient>(
        GRPC_SERVICE_NAMES.BALCONY,
      ),
    );
    this.services.set(
      MICROSERVICES_CLIENTS.IOT_ENGINE_SERVICE,
      this.iotClient.getService<GrpcInvokeClient>(GRPC_SERVICE_NAMES.IOT),
    );
  }

  send<T = unknown>(service: string, cmd: string, payload?: unknown): Promise<T> {
    const client = this.services.get(service);
    if (!client) {
      throw new Error(`gRPC client not found for service: ${service}`);
    }

    return firstValueFrom(
      client.invoke({
        cmd,
        payload: JSON.stringify(payload ?? {}),
      }),
    ).then((response) => {
      if (!response?.payload) return null as T;
      try {
        return JSON.parse(response.payload) as T;
      } catch {
        return response.payload as T;
      }
    });
  }
}

export function getGrpcClientUrl(
  hostEnvKey: string,
  port: string | undefined,
  defaultHost = 'localhost',
): string {
  const host = process.env[hostEnvKey] || defaultHost;
  return `${host}:${port}`;
}

export const GRPC_CLIENT_URLS = {
  identity: () =>
    getGrpcClientUrl('IDENTITY_SERVICE_HOST', IDENTITY_SERVICE_PORT),
  ecommerce: () =>
    getGrpcClientUrl('ECOMMERCE_SERVICE_HOST', ECOMMERCE_SERVICE_PORT),
  balcony: () =>
    getGrpcClientUrl('BALCONY_SERVICE_HOST', BALCONY_SERVICE_PORT),
  iot: () =>
    getGrpcClientUrl('IOT_ENGINE_SERVICE_HOST', IOT_ENGINE_SERVICE_PORT),
};

export { GRPC_PACKAGES, GRPC_SERVICE_NAMES };
