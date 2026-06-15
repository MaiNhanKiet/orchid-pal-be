import { SetMetadata } from '@nestjs/common';

export const GRPC_CMD_KEY = 'grpc:cmd';

export const GrpcCmd = (cmd: string) => SetMetadata(GRPC_CMD_KEY, cmd);
