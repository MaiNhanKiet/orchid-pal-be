import { MICROSERVICES_CLIENTS, parseRpcErrorPayload } from '@app/common';
import {
  IDENTITY_SERVICE_PORT,
  PLANT_SERVICE_PORT,
} from '@app/common/constants/env-key.constant';
import { HttpException, HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
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
    @Inject(MICROSERVICES_CLIENTS.PLANT_SERVICE)
    private readonly plantClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.services.set(
      MICROSERVICES_CLIENTS.IDENTITY_SERVICE,
      this.identityClient.getService<GrpcInvokeClient>(
        GRPC_SERVICE_NAMES.IDENTITY,
      ),
    );
    this.services.set(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      this.plantClient.getService<GrpcInvokeClient>(GRPC_SERVICE_NAMES.PLANT),
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
    )
      .then((response) => {
        if (!response?.payload) return null as T;
        try {
          return JSON.parse(response.payload) as T;
        } catch {
          return response.payload as T;
        }
      })
      .catch((error) => this.mapGrpcError(error));
  }

  private mapGrpcError(error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }

    const err = error as {
      details?: string;
      message?: string;
      error?: { statusCode?: number; status?: number; message?: string };
    };

    const nested = err?.error;
    if (nested && typeof nested === 'object') {
      const statusCode = Number(nested.statusCode ?? nested.status);
      if (!Number.isNaN(statusCode) && statusCode >= 400) {
        throw new HttpException(
          nested.message ?? 'Microservice error',
          statusCode,
        );
      }
    }

    const candidates = [err?.details, err?.message].filter(Boolean) as string[];

    for (const candidate of candidates) {
      const fromJson = parseRpcErrorPayload(candidate);
      if (fromJson) {
        throw new HttpException(fromJson.message, fromJson.statusCode);
      }
    }

    const raw = candidates[0] ?? 'Microservice error';
    const message = String(raw).replace(/^\d+\s+[A-Z_]+:\s*/i, '').trim();
    const status = this.inferHttpStatusFromMessage(message);

    throw new HttpException(message || 'Microservice error', status);
  }

  private inferHttpStatusFromMessage(message: string): number {
    const lower = message.toLowerCase();

    if (
      lower.includes('not found') ||
      lower.includes('không tồn tại') ||
      lower.includes('không tìm thấy')
    ) {
      return HttpStatus.NOT_FOUND;
    }

    if (
      lower.includes('already') ||
      lower.includes('exists') ||
      lower.includes('đã được kích hoạt') ||
      lower.includes('đã có chủ') ||
      lower.includes('đã tồn tại') ||
      lower.includes('đã gắn')
    ) {
      return HttpStatus.CONFLICT;
    }

    if (
      lower.includes('cannot') ||
      lower.includes('must') ||
      lower.includes('invalid') ||
      lower.includes('required') ||
      lower.includes('không đúng') ||
      lower.includes('bắt buộc') ||
      lower.includes('không hợp lệ') ||
      lower.includes('vi phạm')
    ) {
      return HttpStatus.BAD_REQUEST;
    }

    if (lower.includes('forbidden') || lower.includes('không sở hữu')) {
      return HttpStatus.FORBIDDEN;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
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
  plant: () => getGrpcClientUrl('PLANT_SERVICE_HOST', PLANT_SERVICE_PORT),
};

export { GRPC_PACKAGES, GRPC_SERVICE_NAMES };
