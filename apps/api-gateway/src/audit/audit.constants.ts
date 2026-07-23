export const SKIP_AUDIT_KEY = 'skip_audit';

export const AUDIT_SKIP_PATH_PREFIXES = [
  '/docs',
  '/admin/queues',
  '/audit-logs',
  '/admin/audit-logs',
  '/favicon',
  '/health',
];

export const AUDIT_SKIP_METHODS = new Set(['OPTIONS', 'HEAD']);

export const AUDIT_ACTION = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT',
  UPLOAD: 'UPLOAD',
  DOWNLOAD: 'DOWNLOAD',
  BAN: 'BAN',
  UNBAN: 'UNBAN',
  ASSIGN: 'ASSIGN',
  REMOVE: 'REMOVE',
  PUBLISH: 'PUBLISH',
  UNPUBLISH: 'UNPUBLISH',
} as const;

export const HTTP_METHOD_ACTION: Record<string, string> = {
  POST: AUDIT_ACTION.CREATE,
  PUT: AUDIT_ACTION.UPDATE,
  PATCH: AUDIT_ACTION.UPDATE,
  DELETE: AUDIT_ACTION.DELETE,
  GET: AUDIT_ACTION.READ,
};

export function resolveModuleFromPath(path: string): string {
  const segment = path.split('/').filter(Boolean)[0] ?? 'system';
  const map: Record<string, string> = {
    auth: 'auth',
    users: 'users',
    rbac: 'rbac',
    admin: 'admin',
    expert: 'expert',
    experts: 'expert',
    feedback: 'feedback',
    devices: 'devices',
    plants: 'plants',
    products: 'products',
    telemetry: 'telemetry',
    automation: 'automation',
    'audit-logs': 'audit',
    conversations: 'expert',
    notifications: 'notifications',
    chat: 'ai-care',
    orders: 'orders',
  };
  return map[segment] ?? segment;
}

export function shouldSkipAuditPath(path: string): boolean {
  const normalized = path.split('?')[0];
  return AUDIT_SKIP_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}
