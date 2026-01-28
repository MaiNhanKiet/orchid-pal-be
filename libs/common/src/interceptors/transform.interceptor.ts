import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
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
        if (data && typeof data === 'object' && 'statusCode' in data) {
          status = data.statusCode;
        }

        // Set lại status code cho response
        response.status(status);

        let message = 'Success';
        let resultData = data;

        if (data && typeof data === 'object') {
          // Lấy message nếu có
          if ('message' in data) {
            message = data.message;
          }
          const { message: msg, statusCode: code, ...rest } = data;

          // Lấy data còn lại
          resultData = rest;
          if (Object.keys(resultData).length === 0) {
            resultData = null;
          }
        }

        return {
          statusCode: status,
          message: message,
          data: resultData,
        };
      }),
    );
  }
}
