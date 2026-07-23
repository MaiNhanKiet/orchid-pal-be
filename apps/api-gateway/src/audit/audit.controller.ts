import { Permissions, UuidDto } from '@app/common';
import { Permission } from '@app/common/enums';
import {
  Controller,
  Get,
  Header,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { SkipAudit } from './decorators/skip-audit.decorator';
import { ExportAuditLogsDto, QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { AuditViewerGuard } from './guards/audit-viewer.guard';
import { AuditService } from './audit.service';

@ApiTags('13 - Audit Logs')
@ApiBearerAuth('access-token')
@Controller('audit-logs')
@UseGuards(AuditViewerGuard)
@Permissions(Permission.SysViewLogs)
export class AuditLogsController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @SkipAudit()
  @ApiOperation({ summary: 'List audit logs with filters and pagination' })
  list(@Query() query: QueryAuditLogsDto) {
    return this.auditService.list(query);
  }

  @Get('export')
  @SkipAudit()
  @ApiOperation({ summary: 'Export audit logs (CSV / XLSX / PDF)' })
  async export(@Query() query: ExportAuditLogsDto, @Res() res: Response) {
    const format = query.format ?? 'csv';
    const { content, mime, filename } = await this.auditService.export(query, format);
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }

  @Get(':id')
  @SkipAudit()
  @ApiOperation({ summary: 'Get audit log detail by id' })
  getById(@Param() { id }: UuidDto) {
    return this.auditService.getById(id);
  }
}
