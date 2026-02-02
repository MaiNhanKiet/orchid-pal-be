import {
  Catch,
  RpcExceptionFilter,
  ArgumentsHost,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { Prisma } from '@prisma/client';

@Catch()
export class FitRpcExceptionFilter implements RpcExceptionFilter {
  private readonly logger = new Logger(FitRpcExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    // 1. Mặc định là lỗi 500
    let errorResponse = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
    };

    // 2. Xử lý lỗi của PRISMA
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
    }
    // 3. Xử lý lỗi HTTP
    else if (exception.status && exception.response) {
      errorResponse = {
        statusCode: exception.status,
        message: exception.response.message || exception.message,
      };
    }
    // 4. Lỗi lạ khác
    else {
      this.logger.error(exception);
      if (exception.message) errorResponse.message = exception.message;
    }

    // Gửi lỗi đã được đóng gói về Gateway
    return throwError(() => new RpcException(errorResponse));
  }
}
