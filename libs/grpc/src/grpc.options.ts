import { join } from 'path';
import { Transport } from '@nestjs/microservices';

export const GRPC_PROTO_ROOT = join(process.cwd(), 'libs/grpc/proto');

export const GRPC_PACKAGES = {
  IDENTITY: 'identity',
  PLANT: 'plant',
} as const;

export const GRPC_SERVICE_NAMES = {
  IDENTITY: 'IdentityService',
  PLANT: 'PlantService',
} as const;

export function getGrpcProtoPath(filename: string): string {
  return join(GRPC_PROTO_ROOT, filename);
}

export function getGrpcServerOptions(
  packageName: string,
  protoFile: string,
  url: string,
) {
  return {
    transport: Transport.GRPC as const,
    options: {
      package: packageName,
      protoPath: getGrpcProtoPath(protoFile),
      url,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [GRPC_PROTO_ROOT],
      },
    },
  };
}

export function getGrpcClientOptions(
  packageName: string,
  protoFile: string,
  url: string,
) {
  return {
    transport: Transport.GRPC as const,
    options: {
      package: packageName,
      protoPath: getGrpcProtoPath(protoFile),
      url,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [GRPC_PROTO_ROOT],
      },
    },
  };
}
