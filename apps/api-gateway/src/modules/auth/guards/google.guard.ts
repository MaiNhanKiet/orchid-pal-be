import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleOauthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    if (request.query.error === 'access_denied') {
      const response = context.switchToHttp().getResponse();
      return response.redirect(
        `${this.configService.get<string>('FRONTEND_URL')}/login?error=cancelled`,
      );
    }

    if (err || !user) {
      throw err || new UnauthorizedException('Đăng nhập Google thất bại');
    }

    return user;
  }
}
