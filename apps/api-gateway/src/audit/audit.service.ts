import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { mapAuditLogToDto, mapAuditLogsToDto } from './audit.mapper';
import { AuditRepository } from './audit.repository';
import type { CreateAuditLogInput } from './audit.types';
import type { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

const EMPTY_RESULT = {
  data: [],
  meta: { total: 0, page: 1, limit: 20, last_page: 1 },
  migrationRequired: false,
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly repository: AuditRepository) {}

  private isMissingTable(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2021' || error.code === 'P2010')
    );
  }

  /** Fire-and-forget — never blocks the main request */
  recordAsync(input: CreateAuditLogInput) {
    void this.record(input).catch((error) => {
      this.logger.warn(`Audit write failed: ${error instanceof Error ? error.message : error}`);
    });
  }

  async record(input: CreateAuditLogInput) {
    try {
      return await this.repository.create(input);
    } catch (error) {
      if (this.isMissingTable(error)) {
        this.logger.warn('audit_logs table missing — run migration 20260628140000_audit_logs_v2');
        return null;
      }
      throw error;
    }
  }

  /** @deprecated use record/recordAsync — kept for manual rich logs */
  async log(input: {
    userId?: string;
    actorEmail?: string;
    action: string;
    resource: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    return this.record({
      userId: input.userId,
      username: input.actorEmail,
      action: input.action,
      entity: input.resource,
      entityId: input.resourceId,
      newData: input.metadata,
      ipAddress: input.ipAddress,
      module: input.resource,
      description: `${input.action} on ${input.resource}`,
    });
  }

  async list(query: QueryAuditLogsDto) {
    try {
      const { data, total, page, limit } = await this.repository.findMany(query);
      return {
        data: mapAuditLogsToDto(data),
        meta: {
          total,
          page,
          limit,
          last_page: Math.ceil(total / limit) || 1,
        },
        migrationRequired: false,
      };
    } catch (error) {
      if (this.isMissingTable(error)) {
        return {
          ...EMPTY_RESULT,
          meta: { ...EMPTY_RESULT.meta, page: query.page ?? 1, limit: query.limit ?? 20 },
          migrationRequired: true,
        };
      }
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const row = await this.repository.findById(id);
      if (!row) throw new NotFoundException('Audit log not found');
      return mapAuditLogToDto(row);
    } catch (error) {
      if (this.isMissingTable(error)) {
        throw new NotFoundException('Audit logs table not initialized');
      }
      throw error;
    }
  }

  async export(query: QueryAuditLogsDto, format: 'csv' | 'xlsx' | 'pdf' = 'csv') {
    let rows;
    try {
      const data = await this.repository.findAllForExport(query);
      rows = mapAuditLogsToDto(data);
    } catch (error) {
      if (this.isMissingTable(error)) {
        rows = [];
      } else {
        throw error;
      }
    }

    if (format === 'csv' || format === 'xlsx') {
      const header = [
        'timestamp',
        'username',
        'fullName',
        'role',
        'module',
        'entity',
        'action',
        'status',
        'ipAddress',
        'endpoint',
        'description',
      ];
      const lines = [
        header.join(','),
        ...rows.map((r) =>
          [
            r.timestamp,
            r.username,
            r.fullName,
            r.role,
            r.module,
            r.entity,
            r.action,
            r.status,
            r.ipAddress,
            r.endpoint,
            `"${(r.description ?? '').replace(/"/g, '""')}"`,
          ].join(','),
        ),
      ];
      const content = lines.join('\n');
      const mime =
        format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv';
      const ext = format === 'xlsx' ? 'xlsx' : 'csv';
      return { content, mime, filename: `audit-logs-${Date.now()}.${ext}` };
    }

    const content = rows
      .map(
        (r) =>
          `${r.timestamp} | ${r.username} | ${r.action} | ${r.module}/${r.entity} | ${r.status}`,
      )
      .join('\n');
    return {
      content,
      mime: 'application/pdf',
      filename: `audit-logs-${Date.now()}.txt`,
    };
  }
}
