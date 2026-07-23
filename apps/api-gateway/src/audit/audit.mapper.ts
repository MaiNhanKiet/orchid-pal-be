import type { AuditLogRecord } from './audit.types';

export type AuditLogDto = {
  id: string;
  userId: string | null;
  username: string | null;
  fullName: string | null;
  role: string | null;
  module: string | null;
  entity: string | null;
  entityId: string | null;
  action: string;
  description: string | null;
  oldData: unknown;
  newData: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  requestMethod: string | null;
  endpoint: string | null;
  status: string;
  responseCode: number | null;
  durationMs: number | null;
  timestamp: string;
};

export function mapAuditLogToDto(row: AuditLogRecord): AuditLogDto {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    fullName: row.full_name,
    role: row.role,
    module: row.module,
    entity: row.entity ?? row.resource,
    entityId: row.entity_id ?? row.resource_id,
    action: row.action,
    description: row.description,
    oldData: row.old_data,
    newData: row.new_data ?? row.metadata,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    requestMethod: row.request_method,
    endpoint: row.endpoint,
    status: row.status,
    responseCode: row.response_code,
    durationMs: row.duration_ms,
    timestamp: row.created_at.toISOString(),
  };
}

export function mapAuditLogsToDto(rows: AuditLogRecord[]): AuditLogDto[] {
  return rows.map(mapAuditLogToDto);
}
