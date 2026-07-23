/**
 * Resolve where to send the browser after Google OAuth (web).
 * Prefer `app_redirect` from OAuth state (sent by the live FE origin),
 * fall back to FRONTEND_URL. Blocks open redirects via allowlist.
 */

const DEV_ORIGINS = [
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function buildAllowlist(configuredFrontendUrl?: string): Set<string> {
  const allowed = new Set<string>([
    'https://growpal.shop',
    'https://www.growpal.shop',
    ...DEV_ORIGINS,
  ]);

  const configured = originOf((configuredFrontendUrl || '').trim());
  if (configured) allowed.add(configured);

  const extra = (process.env.ALLOWED_FRONTEND_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const item of extra) {
    const origin = originOf(item) || item.replace(/\/$/, '');
    if (origin) allowed.add(origin);
  }

  return allowed;
}

/**
 * Pick a safe frontend origin for post-auth redirect.
 */
export function resolveFrontendOrigin(
  configuredFrontendUrl?: string,
  appRedirect?: string,
): string {
  const allowlist = buildAllowlist(configuredFrontendUrl);
  const configuredOrigin =
    originOf((configuredFrontendUrl || '').trim()) ||
    (configuredFrontendUrl || '').replace(/\/$/, '');

  if (appRedirect) {
    const candidate = originOf(appRedirect);
    if (candidate && allowlist.has(candidate)) {
      return candidate;
    }
  }

  // Production must not bounce users to a local FE if misconfigured.
  if (
    process.env.NODE_ENV === 'production' &&
    configuredOrigin &&
    /localhost|127\.0\.0\.1/i.test(configuredOrigin)
  ) {
    return 'https://growpal.shop';
  }

  if (configuredOrigin && allowlist.has(configuredOrigin)) {
    return configuredOrigin;
  }

  if (configuredOrigin) {
    return configuredOrigin;
  }

  return 'https://growpal.shop';
}

export function buildWebAuthSuccessRedirect(
  configuredFrontendUrl: string | undefined,
  appRedirect: string | undefined,
  accessToken: string,
): string {
  const origin = resolveFrontendOrigin(configuredFrontendUrl, appRedirect);
  const url = new URL(origin);
  url.searchParams.set('token', accessToken);
  return url.toString();
}
