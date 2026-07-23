export const AUTH_ERROR_CODES = {
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  ACCOUNT_ALREADY_EXISTS: 'ACCOUNT_ALREADY_EXISTS',
  GOOGLE_AUTH_CANCELLED: 'GOOGLE_AUTH_CANCELLED',
} as const;

export type GoogleOAuthIntent = 'login';

export const AUTH_ERROR_QUERY_PARAMS = {
  ACCOUNT_NOT_FOUND: 'account_not_found',
  ACCOUNT_ALREADY_EXISTS: 'account_already_exists',
} as const;

export function getAuthErrorRedirectPath(errorCode: string): string | null {
  switch (errorCode) {
    case AUTH_ERROR_CODES.ACCOUNT_NOT_FOUND:
      return `/login?error=${AUTH_ERROR_QUERY_PARAMS.ACCOUNT_NOT_FOUND}`;
    case AUTH_ERROR_CODES.ACCOUNT_ALREADY_EXISTS:
      return `/login?error=${AUTH_ERROR_QUERY_PARAMS.ACCOUNT_ALREADY_EXISTS}`;
    default:
      return null;
  }
}

export function getAuthErrorRedirectUrl(
  frontendUrl: string,
  errorCode: string,
): string | null {
  const path = getAuthErrorRedirectPath(errorCode);
  if (!path) return null;
  const base = frontendUrl.replace(/\/$/, '');
  return `${base}${path}`;
}

export function normalizeAuthErrorMessage(message: unknown): string {
  if (Array.isArray(message)) {
    return typeof message[0] === 'string' ? message[0] : '';
  }
  return typeof message === 'string' ? message : '';
}

const AUTH_ERROR_CODE_VALUES = new Set<string>(Object.values(AUTH_ERROR_CODES));

export function isAuthErrorCode(
  code: string,
): code is (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES] {
  return AUTH_ERROR_CODE_VALUES.has(code);
}

function parseAuthCodeFromString(raw: string): string {
  if (!raw) return '';
  if (isAuthErrorCode(raw)) return raw;

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        message?: string;
        statusCode?: number;
      };
      if (parsed.message && isAuthErrorCode(parsed.message)) {
        return parsed.message;
      }
      if (
        parsed.statusCode === 401 &&
        typeof parsed.message === 'string' &&
        parsed.message.includes(AUTH_ERROR_CODES.ACCOUNT_NOT_FOUND)
      ) {
        return AUTH_ERROR_CODES.ACCOUNT_NOT_FOUND;
      }
      if (parsed.statusCode === 409) {
        return AUTH_ERROR_CODES.ACCOUNT_ALREADY_EXISTS;
      }
    } catch {
      // ignore
    }
  }

  if (raw.includes(AUTH_ERROR_CODES.ACCOUNT_NOT_FOUND)) {
    return AUTH_ERROR_CODES.ACCOUNT_NOT_FOUND;
  }
  if (raw.includes(AUTH_ERROR_CODES.ACCOUNT_ALREADY_EXISTS)) {
    return AUTH_ERROR_CODES.ACCOUNT_ALREADY_EXISTS;
  }
  return '';
}

export function extractAuthErrorCode(err: unknown): string {
  if (!err) return '';
  if (typeof err === 'string') return parseAuthCodeFromString(err);
  if (typeof err !== 'object') return '';

  const candidate = err as Record<string, unknown> & {
    getResponse?: () => unknown;
  };

  const responseBody =
    typeof candidate.getResponse === 'function'
      ? candidate.getResponse()
      : candidate.response;

  const fromResponse = normalizeAuthErrorMessage(
    typeof responseBody === 'object' &&
      responseBody !== null &&
      'message' in responseBody
      ? (responseBody as { message?: unknown }).message
      : responseBody,
  );
  if (isAuthErrorCode(fromResponse)) return fromResponse;

  const fromNested = normalizeAuthErrorMessage(
    (candidate.error as { message?: unknown } | undefined)?.message,
  );
  if (isAuthErrorCode(fromNested)) return fromNested;

  const fromDirect = normalizeAuthErrorMessage(candidate.message);
  if (isAuthErrorCode(fromDirect)) return fromDirect;

  if (typeof candidate.details === 'string') {
    const fromDetails = parseAuthCodeFromString(candidate.details);
    if (fromDetails) return fromDetails;
  }

  const nestedStatusCode =
    (typeof responseBody === 'object' &&
    responseBody !== null &&
    'statusCode' in responseBody
      ? (responseBody as { statusCode?: number }).statusCode
      : undefined) ??
    (candidate.error as { statusCode?: number } | undefined)?.statusCode ??
    (candidate as { statusCode?: number }).statusCode;

  if (nestedStatusCode === 401) {
    const hint = [fromResponse, fromNested, fromDirect].filter(Boolean).join(' ');
    if (hint.includes(AUTH_ERROR_CODES.ACCOUNT_NOT_FOUND)) {
      return AUTH_ERROR_CODES.ACCOUNT_NOT_FOUND;
    }
  }
  if (nestedStatusCode === 409) return AUTH_ERROR_CODES.ACCOUNT_ALREADY_EXISTS;

  return parseAuthCodeFromString(JSON.stringify(candidate));
}
