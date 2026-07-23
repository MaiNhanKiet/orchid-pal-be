import {

  CallHandler,

  ExecutionContext,

  Injectable,

  NestInterceptor,

} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { Request, Response } from 'express';

import { Observable, throwError } from 'rxjs';

import { catchError, tap } from 'rxjs/operators';

import {

  SKIP_AUDIT_KEY,

  resolveModuleFromPath,

} from './audit.constants';

import {

  resolveAction,

  resolveActor,

  resolveEntityFromPath,

  sanitizeAuditData,

  shouldAuditRequest,

} from './audit.interceptor.helpers';

import { AuditService } from './audit.service';

import { AUDIT_LOG_STATUS } from './audit.types';



function getClientIp(req: Request): string | undefined {

  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim();

  return req.ip || req.socket?.remoteAddress;

}



@Injectable()

export class AuditInterceptor implements NestInterceptor {

  constructor(

    private readonly auditService: AuditService,

    private readonly reflector: Reflector,

  ) {}



  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {

    if (context.getType() !== 'http') return next.handle();



    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_AUDIT_KEY, [

      context.getHandler(),

      context.getClass(),

    ]);

    if (skip) return next.handle();



    const http = context.switchToHttp();

    const req = http.getRequest<Request>();

    const res = http.getResponse<Response>();



    if (!shouldAuditRequest(req)) return next.handle();



    const started = Date.now();

    const path = req.originalUrl?.split('?')[0] ?? req.url;

    const actor = resolveActor(req);

    const { entity, entityId } = resolveEntityFromPath(path);



    const base = {

      ...actor,

      module: resolveModuleFromPath(path),

      entity,

      entityId,

      action: resolveAction(req.method, path),

      requestMethod: req.method,

      endpoint: path,

      ipAddress: getClientIp(req),

      userAgent: req.get('user-agent') ?? undefined,

      newData: sanitizeAuditData(req.body),

      description: `${req.method} ${path}`,

    };



    return next.handle().pipe(

      tap(() => {

        this.auditService.recordAsync({

          ...base,

          status: AUDIT_LOG_STATUS.SUCCESS,

          responseCode: res.statusCode,

          durationMs: Date.now() - started,

        });

      }),

      catchError((error) => {

        const statusCode =

          typeof error?.status === 'number'

            ? error.status

            : typeof error?.getStatus === 'function'

              ? error.getStatus()

              : 500;



        this.auditService.recordAsync({

          ...base,

          status: AUDIT_LOG_STATUS.FAILED,

          responseCode: statusCode,

          durationMs: Date.now() - started,

          description: `${req.method} ${path} — ${error?.message ?? 'failed'}`,

        });



        return throwError(() => error);

      }),

    );

  }

}


