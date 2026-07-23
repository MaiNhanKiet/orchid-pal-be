import { Request } from 'express';
import type { JwtPayload } from '@app/common';
import {
  AUDIT_ACTION,
  AUDIT_SKIP_METHODS,
  HTTP_METHOD_ACTION,
  shouldSkipAuditPath,
} from './audit.constants';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SENSITIVE_BODY_KEYS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'refresh_token',
  'secret',
  'authorization',
  'creditcard',
  'cvv',
]);

export function shouldAuditRequest(req: Request): boolean {
  if (AUDIT_SKIP_METHODS.has(req.method)) return false;

  const path = req.originalUrl?.split('?')[0] ?? req.url;
  if (shouldSkipAuditPath(path)) return false;

  return true;
}

export function sanitizeAuditData(
  data: unknown,
): Record<string, unknown> | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return undefined;
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_BODY_KEYS.has(key.toLowerCase())) {
      out[key] = '[REDACTED]';
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = sanitizeAuditData(value);
      if (nested) out[key] = nested;
      continue;
    }
    out[key] = value;
  }

  return Object.keys(out).length ? out : undefined;
}

export function resolveActor(req: Request): {
  userId?: string;
  username?: string;
  fullName?: string;
  role?: string;
} {
  const user = req.user as JwtPayload | undefined;
  if (user?.sub) {
    return {
      userId: user.sub,
      username: user.email,
      fullName: user.full_name,
      role: Array.isArray(user.role)
        ? user.role.join(',')
        : String(user.role ?? ''),
    };
  }

  const body = req.body as Record<string, unknown> | undefined;
  const email =
    typeof body?.email === 'string'
      ? body.email
      : typeof body?.username === 'string'
        ? body.username
        : undefined;

  return email ? { username: email } : {};
}

export function resolveAction(method: string, path: string): string {
  const lower = path.toLowerCase();

  if (lower.includes('/auth')) {
    if (method === 'POST' && lower.includes('logout')) return AUDIT_ACTION.LOGOUT;
    if (method === 'POST' && lower.includes('refresh')) return 'REFRESH';
    if (method === 'GET' && lower.includes('google')) return AUDIT_ACTION.LOGIN;
    if (method === 'POST') return AUDIT_ACTION.LOGIN;
  }

  if (lower.includes('unpublish')) return AUDIT_ACTION.UNPUBLISH;
  if (lower.includes('/publish')) return AUDIT_ACTION.PUBLISH;
  if (lower.includes('unban')) return AUDIT_ACTION.UNBAN;
  if (lower.includes('ban')) return AUDIT_ACTION.BAN;
  if (lower.includes('reject')) return AUDIT_ACTION.REJECT;
  if (lower.includes('approve')) return AUDIT_ACTION.APPROVE;
  if (lower.includes('assign-role') && method === 'DELETE') return AUDIT_ACTION.REMOVE;
  if (lower.includes('assign-role')) return AUDIT_ACTION.ASSIGN;
  if (lower.includes('/rbac/permissions') && method === 'POST') return AUDIT_ACTION.ASSIGN;
  if (lower.includes('upload')) return AUDIT_ACTION.UPLOAD;
  if (lower.includes('export')) return AUDIT_ACTION.EXPORT;
  if (lower.includes('import')) return AUDIT_ACTION.IMPORT;
  if (lower.includes('/download')) return AUDIT_ACTION.DOWNLOAD;

  if (lower.includes('/reviews') && method === 'PATCH') {
    return AUDIT_ACTION.APPROVE;
  }

  return HTTP_METHOD_ACTION[method] ?? method;
}

export function resolveEntityFromPath(path: string): {
  entity?: string;
  entityId?: string;
} {
  const segments = path.split('/').filter(Boolean);

  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const segment = segments[i];
    if (UUID_RE.test(segment)) {
      const rawEntity = segments[i - 1] ?? 'resource';
      const entity = rawEntity.replace(/-/g, '_').replace(/s$/, '');
      return { entity, entityId: segment };
    }
  }

  const last = segments[segments.length - 1];
  if (last && !['mine', 'reviews', 'admin', 'export', 'submit'].includes(last)) {
    const prev = segments[segments.length - 2];
    if (prev && !UUID_RE.test(prev)) {
      return { entity: prev.replace(/-/g, '_'), entityId: last };
    }
  }

  return {};
}
