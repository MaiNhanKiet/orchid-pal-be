import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  constructor() {
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

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new UnauthorizedException('GOOGLE_AUTH_CANCELLED');
    }

    return user;
  }
}
