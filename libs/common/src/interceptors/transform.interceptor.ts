import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        const contextHttp = context.switchToHttp();
        const response = contextHttp.getResponse();

        let status = HttpStatus.OK;
        let message = 'Success';
        let resultData = data;
        let meta = undefined;

        if (data && typeof data === 'object') {
          // Nếu data là mảng thì giữ nguyên
          if (Array.isArray(data)) {
            resultData = data;
          } else {
            // Nếu data có cấu trúc { data: ..., meta: ... }
            // Thì tách riêng phần data và meta
            if ('data' in data && 'meta' in data) {
              message = data.message || message;
              status = data.statusCode || status;
              resultData = data.data;
              meta = data.meta;
            } else {
              if ('statusCode' in data) status = data.statusCode;
              if ('message' in data) message = data.message;

              const { statusCode, message: msg, ...rest } = data;
              resultData = rest;

              if (Object.keys(resultData).length === 0) {
                resultData = null;
              }
            }
          }
        }

        response.status(status);

        return {
          statusCode: status,
          message: message,
          data: resultData,
          meta: meta,
        };
      }),
    );
  }
}
