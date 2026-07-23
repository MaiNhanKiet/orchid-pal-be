import { PrismaModule } from '@app/prisma';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogsController } from './audit.controller';
import { AuditInterceptor } from './audit.interceptor';
import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';
import { AuditViewerGuard } from './guards/audit-viewer.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AuditLogsController],
  providers: [
    AuditRepository,
    AuditService,
    AuditViewerGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
  exports: [AuditService],
})
export class AuditModule {}
