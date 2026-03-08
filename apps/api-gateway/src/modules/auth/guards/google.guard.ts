import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

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

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
    const rawState = req.query.state as string;

    let platform = 'web';
    let appRedirect: string;

    if (rawState) {
      try {
        const decoded = JSON.parse(
          Buffer.from(rawState, 'base64url').toString('utf-8'),
        ) as {
          platform?: string;
          appRedirect?: string;
        };
        platform = decoded.platform || 'web';
        appRedirect = decoded.appRedirect;
      } catch {
        platform = rawState;
      }
    }

    if (platform === 'mobile') {
      const target = appRedirect;
      if (target) {
        const redirect = new URL(target);
        redirect.searchParams.set('status', 'cancelled');
        return res.redirect(redirect.toString());
      }
    }

    if (err || !user) {
      throw new UnauthorizedException('GOOGLE_AUTH_CANCELLED');
    }
  }
}
