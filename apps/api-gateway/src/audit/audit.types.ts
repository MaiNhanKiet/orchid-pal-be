export const AUDIT_LOG_STATUS = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  WARNING: 'WARNING',
} as const;

export type AuditLogStatus = (typeof AUDIT_LOG_STATUS)[keyof typeof AUDIT_LOG_STATUS];

export const AUDIT_VIEWER_ROLES = [
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'AUDITOR',
] as const;

export type AuditViewerRole = (typeof AUDIT_VIEWER_ROLES)[number];

export type CreateAuditLogInput = {
  userId?: string;
  username?: string;
  fullName?: string;
  role?: string;
  module?: string;
  entity?: string;
  entityId?: string;
  action: string;
  description?: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  endpoint?: string;
  status?: AuditLogStatus;
  responseCode?: number;
  durationMs?: number;
};

export type AuditLogRecord = {
  id: string;
  user_id: string | null;
  username: string | null;
  full_name: string | null;
  role: string | null;
  module: string | null;
  entity: string | null;
  entity_id: string | null;
  action: string;
  description: string | null;
  old_data: unknown;
  new_data: unknown;
  ip_address: string | null;
  user_agent: string | null;
  request_method: string | null;
  endpoint: string | null;
  status: string;
  response_code: number | null;
  duration_ms: number | null;
  created_at: Date;
  resource?: string | null;
  resource_id?: string | null;
  metadata?: unknown;
};
