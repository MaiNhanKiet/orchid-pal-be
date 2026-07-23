import { MICROSERVICES_CLIENTS, Public, RequestWithUser } from '@app/common';
import { GrpcRpcService } from '@app/grpc';
import { RedisService } from '@app/redis';
import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  ApiGoogleAuthCallbackDocs,
  ApiGoogleAuthDocs,
  ApiLogoutDocs,
  ApiRefreshTokenDocs,
} from './auth.swagger';
import { GoogleOauthGuard } from './guards/google.guard';
import { buildWebAuthSuccessRedirect } from './resolve-frontend-redirect';

@ApiTags('01 - Auth')
@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly grpcRpc: GrpcRpcService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  @Get('google/login')
  @UseGuards(GoogleOauthGuard)
  @ApiGoogleAuthDocs('login')
  async googleLogin() {}

  /** @deprecated Use GET /auth/google/login */
  @Get('google')
  @UseGuards(GoogleOauthGuard)
  @ApiGoogleAuthDocs('login')
  async googleAuthLegacy() {}

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  @ApiGoogleAuthCallbackDocs()
  async googleAuthRedirect(@Req() req: RequestWithUser, @Res() res: Response) {
    const { accessToken, refreshToken } = req.user;

    const rawState = req.query.state as string;

    let platform = 'web';
    let appRedirect: string | undefined;

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
      if (!appRedirect) {
        throw new UnauthorizedException('Missing mobile app redirect');
      }
      const redirect = new URL(appRedirect);
      redirect.searchParams.set('token', accessToken);
      redirect.searchParams.set('refreshToken', refreshToken);
      return res.redirect(redirect.toString());
    }

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    return res.redirect(
      buildWebAuthSuccessRedirect(frontendUrl, appRedirect, accessToken),
    );
  }

  @Post('refresh')
  @ApiRefreshTokenDocs()
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const oldRefreshToken = req.cookies['refresh_token'];

    if (!oldRefreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    const result = await this.grpcRpc.send<{
      accessToken: string;
      refreshToken: string;
    }>(MICROSERVICES_CLIENTS.IDENTITY_SERVICE, 'refresh_token', {
      oldRefreshToken,
      deviceAgent: req.headers['x-forwarded-for'],
      ipAddress: req.ip,
    });

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      accessToken: result.accessToken,
    };
  }

  @Post('logout')
  @ApiLogoutDocs()
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];

    if (refreshToken) {
      await this.grpcRpc.send(MICROSERVICES_CLIENTS.IDENTITY_SERVICE, 'logout', {
        refreshToken,
      });
    }

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return {
      message: 'Logged out successfully',
    };
  }
}
