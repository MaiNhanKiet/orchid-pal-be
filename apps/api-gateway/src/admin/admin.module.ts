import { PrismaModule } from '@app/prisma';
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AdminController],
})
export class AdminModule {}
