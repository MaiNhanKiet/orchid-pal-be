import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    // Các tùy chọn mặc định cho Google OAuth
    super({
      prompt: 'select_account consent',
      access_type: 'offline',
    });
  }

  /**
   * Ghi đè options để gắn thêm "state" dựa trên query platform ban đầu.
   * Google sẽ trả lại "state" y nguyên ở callback, giúp ta biết đó là web hay mobile.
   */
  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const platform = (req.query.platform as string) || 'web';

    console.log('platform > guard', platform);

    return {
      prompt: 'select_account consent',
      access_type: 'offline',
      state: platform, // sẽ được trả lại ở query "state" tại callback
    };
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw new UnauthorizedException('GOOGLE_AUTH_CANCELLED');
    }

    return user;
  }
}
