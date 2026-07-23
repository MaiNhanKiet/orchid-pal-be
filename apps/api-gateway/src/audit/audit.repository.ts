import { Prisma } from '@prisma/client';
import { PrismaService } from '@app/prisma';
import { Injectable } from '@nestjs/common';
import type { CreateAuditLogInput } from './audit.types';
import type { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Injectable()
export class AuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAuditLogInput) {
    return this.prisma.audit_logs.create({
      data: {
        user_id: input.userId,
        username: input.username,
        full_name: input.fullName,
        role: input.role,
        module: input.module,
        entity: input.entity,
        entity_id: input.entityId,
        action: input.action,
        description: input.description,
        old_data: input.oldData as Prisma.InputJsonValue | undefined,
        new_data: input.newData as Prisma.InputJsonValue | undefined,
        ip_address: input.ipAddress,
        user_agent: input.userAgent,
        request_method: input.requestMethod,
        endpoint: input.endpoint,
        status: input.status ?? 'SUCCESS',
        response_code: input.responseCode,
        duration_ms: input.durationMs,
        actor_email: input.username,
        resource: input.entity,
        resource_id: input.entityId,
        metadata: input.newData as Prisma.InputJsonValue | undefined,
      },
    });
  }

  buildWhere(query: QueryAuditLogsDto): Prisma.audit_logsWhereInput {
    const where: Prisma.audit_logsWhereInput = {};

    if (query.user_id) where.user_id = query.user_id;
    if (query.module) where.module = { equals: query.module, mode: 'insensitive' };
    if (query.action) where.action = { equals: query.action, mode: 'insensitive' };
    if (query.entity) where.entity = { equals: query.entity, mode: 'insensitive' };
    if (query.status) where.status = query.status;
    if (query.role) where.role = { contains: query.role, mode: 'insensitive' };

    if (query.from || query.to) {
      where.created_at = {};
      if (query.from) where.created_at.gte = new Date(query.from);
      if (query.to) where.created_at.lte = new Date(query.to);
    }

    if (query.keyword?.trim()) {
      const q = query.keyword.trim();
      where.OR = [
        { username: { contains: q, mode: 'insensitive' } },
        { full_name: { contains: q, mode: 'insensitive' } },
        { action: { contains: q, mode: 'insensitive' } },
        { module: { contains: q, mode: 'insensitive' } },
        { entity: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { endpoint: { contains: q, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  async findMany(query: QueryAuditLogsDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;
    const where = this.buildWhere(query);

    const sortField = query.sort_by ?? 'created_at';
    const sortOrder = query.sort_order ?? 'desc';

    const [data, total] = await Promise.all([
      this.prisma.audit_logs.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrder },
      }),
      this.prisma.audit_logs.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    return this.prisma.audit_logs.findUnique({ where: { id } });
  }

  async findAllForExport(query: QueryAuditLogsDto, max = 5000) {
    const where = this.buildWhere(query);
    return this.prisma.audit_logs.findMany({
      where,
      take: max,
      orderBy: { created_at: 'desc' },
    });
  }
}
