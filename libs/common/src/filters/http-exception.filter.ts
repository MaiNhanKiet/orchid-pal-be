import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import {
  AUTH_ERROR_CODES,
  extractAuthErrorCode,
  getAuthErrorRedirectUrl,
  normalizeAuthErrorMessage,
} from '../constants/auth.constants';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';

    if (response.headersSent) {
      this.logger.warn(
        'Headers already sent, skipping exception filter response.',
      );
      return;
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();

      if (
        status === HttpStatus.UNAUTHORIZED &&
        normalizeAuthErrorMessage(
          (responseBody as { message?: unknown }).message,
        ) === AUTH_ERROR_CODES.GOOGLE_AUTH_CANCELLED
      ) {
        const frontendUrl = this.configService.get<string>('FRONTEND_URL');
        return response.redirect(`${frontendUrl}/login?status=cancelled`);
      }

      const httpMessage =
        extractAuthErrorCode(exception) ||
        normalizeAuthErrorMessage(
          typeof responseBody === 'object' &&
            responseBody !== null &&
            'message' in responseBody
            ? (responseBody as { message?: unknown }).message
            : responseBody,
        );

      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      if (frontendUrl && request.url.includes('/auth/google/callback')) {
        const redirectUrl = getAuthErrorRedirectUrl(frontendUrl, httpMessage);
        if (redirectUrl) {
          return response.redirect(redirectUrl);
        }
      }

      message = httpMessage || responseBody;
    } else if (this.isRpcError(exception)) {
      const errorObj = exception as {
        error?: { statusCode?: number; status?: number; message?: unknown };
        statusCode?: number;
        status?: number;
        message?: unknown;
      };

      const realError = errorObj.error || errorObj;
      status = Number(realError.statusCode || realError.status);
      message =
        extractAuthErrorCode(exception) ||
        normalizeAuthErrorMessage(realError.message) ||
        'Microservice Error';

      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      if (frontendUrl && request.url.includes('/auth/google/callback')) {
        const redirectUrl = getAuthErrorRedirectUrl(frontendUrl, message);
        if (redirectUrl) {
          return response.redirect(redirectUrl);
        }
      }
    } else if (this.isNotFoundError(exception)) {
      status = HttpStatus.NOT_FOUND;
      message = 'Resource not found';
    } else {
      this.logger.error(exception);
    }

    if (isNaN(status) || typeof status !== 'number') {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    response.status(status).json({
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private isRpcError(exception: any): boolean {
    if (!exception || typeof exception !== 'object') return false;

    const isFlatError = 'status' in exception || 'statusCode' in exception;
    const isNestedError =
      'error' in exception &&
      typeof exception.error === 'object' &&
      ('status' in exception.error || 'statusCode' in exception.error);

    return isFlatError || isNestedError;
  }

  private isNotFoundError(exception: any): boolean {
    if (exception.name === 'EntityNotFoundError') return true;
    if (exception.code === 'P2025') return true;
    return false;
  }
}
