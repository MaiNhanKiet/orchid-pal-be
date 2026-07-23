import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import {
  AUTH_ERROR_CODES,
  extractAuthErrorCode,
  getAuthErrorRedirectUrl,
} from '@app/common/constants/auth.constants';
import { resolveFrontendOrigin } from '../resolve-frontend-redirect';

function decodeOAuthState(rawState?: string) {
  if (!rawState) {
    return {
      platform: 'web',
      appRedirect: undefined as string | undefined,
    };
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(rawState, 'base64url').toString('utf-8'),
    ) as {
      platform?: string;
      appRedirect?: string;
    };

    return {
      platform: decoded.platform || 'web',
      appRedirect: decoded.appRedirect,
    };
  } catch {
    return {
      platform: rawState,
      appRedirect: undefined as string | undefined,
    };
  }
}

@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super({
      prompt: 'select_account consent',
      access_type: 'offline',
    });
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const platform = (req.query.platform as string) || 'web';
    const appRedirect = req.query.app_redirect as string | undefined;

    const statePayload = {
      platform,
      appRedirect,
    };

    return {
      prompt: 'select_account consent',
      access_type: 'offline',
      state: Buffer.from(JSON.stringify(statePayload)).toString('base64url'),
    };
  }

  handleRequest(err: any, user: any, _info: any, context: ExecutionContext) {
    if (user) {
      return user;
    }

    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { platform, appRedirect } = decodeOAuthState(
      req.query.state as string | undefined,
    );

    if (platform === 'mobile' && appRedirect) {
      const redirect = new URL(appRedirect);
      redirect.searchParams.set('status', 'cancelled');
      return res.redirect(redirect.toString());
    }

    const configuredFrontend =
      this.configService.get<string>('FRONTEND_URL') || '';
    const frontendUrl = resolveFrontendOrigin(
      configuredFrontend,
      appRedirect,
    );
    const message = extractAuthErrorCode(err);
    const authRedirect = getAuthErrorRedirectUrl(frontendUrl, message);
    if (authRedirect) {
      return res.redirect(authRedirect);
    }

    const status =
      message === AUTH_ERROR_CODES.GOOGLE_AUTH_CANCELLED
        ? 'cancelled'
        : 'auth_failed';

    if (err || !user) {
      return res.redirect(`${frontendUrl}/login?status=${status}`);
    }

    throw new UnauthorizedException(AUTH_ERROR_CODES.GOOGLE_AUTH_CANCELLED);
  }
}
