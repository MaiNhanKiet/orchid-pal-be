import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';
import { Observable, throwError } from 'rxjs';
import {
  parseRpcErrorPayload,
  RpcErrorPayload,
  serializeRpcErrorPayload,
} from '../constants/device.constants';

@Catch()
export class FitRpcExceptionFilter implements RpcExceptionFilter {
  private readonly logger = new Logger(FitRpcExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    let errorResponse: RpcErrorPayload = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
    };

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2025':
        case 'P2001':
          errorResponse = {
            statusCode: HttpStatus.NOT_FOUND,
            message: 'Resource not found',
          };
          break;

        case 'P2002':
          errorResponse = {
            statusCode: HttpStatus.CONFLICT,
            message: `Unique constraint failed on field: ${(exception.meta as any)?.target}`,
          };
          break;

        case 'P2003':
          errorResponse = {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Foreign key constraint violation',
          };
          break;

        default:
          this.logger.error(
            `Prisma Error: ${exception.code} - ${exception.message}`,
          );
          errorResponse = {
            statusCode: HttpStatus.BAD_REQUEST,
            message: `Database Error: ${exception.code}`,
          };
          break;
      }
    } else if (exception instanceof HttpException) {
      errorResponse = this.fromHttpException(exception);
    } else if (exception instanceof RpcException) {
      errorResponse = this.fromRpcException(exception);
    } else {
      this.logger.error(exception);
      if (exception?.message) {
        errorResponse.message = String(exception.message);
      }
    }

    return throwError(() => new RpcException(serializeRpcErrorPayload(errorResponse)));
  }

  private fromHttpException(exception: HttpException): RpcErrorPayload {
    const response = exception.getResponse();
    const statusCode = exception.getStatus();
    let message = exception.message;
    let code: string | undefined;

    if (typeof response === 'string') {
      message = response;
    } else if (typeof response === 'object' && response !== null) {
      const body = response as {
        message?: string | string[] | { message?: string; code?: string };
        code?: string;
        statusCode?: number;
      };
      if (typeof body.message === 'string') {
        message = body.message;
      } else if (Array.isArray(body.message)) {
        message = String(body.message[0] ?? message);
      } else if (
        typeof body.message === 'object' &&
        body.message !== null &&
        typeof body.message.message === 'string'
      ) {
        message = body.message.message;
        code = body.message.code ?? code;
      }
      if (typeof body.code === 'string') {
        code = body.code;
      }
    }

    return {
      statusCode,
      message: message || 'Error',
      ...(code ? { code } : {}),
    };
  }

  private fromRpcException(exception: RpcException): RpcErrorPayload {
    const error = exception.getError();

    if (typeof error === 'string') {
      const parsed = parseRpcErrorPayload(error);
      if (parsed) return parsed;

      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error,
      };
    }

    const payload = error as RpcErrorPayload;
    return {
      statusCode: Number(payload.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR),
      message: payload.message ?? 'Microservice error',
      code: payload.code,
    };
  }
}
