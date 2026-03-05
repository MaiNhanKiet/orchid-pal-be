import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  Post,
  UnauthorizedException,
  Inject,
  Body,
} from '@nestjs/common';
import { GoogleLoginDto, MICROSERVICES_CLIENTS, Public } from '@app/common';
import { ConfigService } from '@nestjs/config';
import { GoogleOauthGuard } from './guards/google.guard';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGoogleAuthDocs,
  ApiGoogleAuthCallbackDocs,
  ApiRefreshTokenDocs,
  ApiLogoutDocs,
} from './auth.swagger';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { RedisService } from '@app/redis';

@ApiTags('Auth')
@Controller('auth')
@Public()
export class AuthController {
  constructor(
    @Inject(MICROSERVICES_CLIENTS.IAM_SERVICE)
    private readonly iamClient: ClientProxy,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) { }

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  @ApiGoogleAuthDocs()
  async googleAuth() { }

  @Post('google/mobile')
  async googleAuthMobile(@Body() body: GoogleLoginDto, @Req() req: Request) {
    const deviceAgent =
      body.deviceAgent || (req.headers['user-agent'] as string) || '';
    const ipAddress =
      body.ipAddress ||
      ((req.headers['x-forwarded-for'] as string) || req.ip || '');

    const payload: GoogleLoginDto = {
      ...body,
      provider: 'google',
      deviceAgent,
      ipAddress,
    };

    const result = await firstValueFrom(
      this.iamClient.send({ cmd: 'google_login' }, payload),
    );

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  @ApiGoogleAuthCallbackDocs()
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const { accessToken, refreshToken } = (req as any).user;
    // Ưu tiên lấy từ "state" (Google trả lại), fallback sang query "platform" nếu có
    const platform =
      (req.query.state as string) ||
      (req.query.platform as string) ||
      'web';

    if (refreshToken) {
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        // path: '/auth/refresh',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    // Nếu là mobile: redirect về deeplink (ví dụ: orchidpal://auth?token=...)
    if (platform === 'mobile') {
      const mobileDeeplink =
        this.configService.get<string>('MOBILE_DEEPLINK_URL') || '';

      if (!mobileDeeplink) {
        // Fallback: nếu chưa cấu hình deeplink thì trả JSON
        return res.json({ accessToken });
      }

      return res.redirect(`${mobileDeeplink}?token=${accessToken}`);
    }

    // Mặc định: web, redirect về FRONTEND_URL như cũ
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    return res.redirect(`${frontendUrl}?token=${accessToken}`);
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

    const result = await firstValueFrom(
      this.iamClient.send(
        { cmd: 'refresh_token' },
        {
          oldRefreshToken,
          deviceAgent: req.headers['x-forwarded-for'],
          ipAddress: req.ip,
        },
      ),
    );

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      // path: '/auth/refresh',
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
      await firstValueFrom(
        this.iamClient.send({ cmd: 'logout' }, { refreshToken }),
      );
    }

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/auth/refresh',
    });

    return {
      message: 'Logged out successfully',
    };
  }
}
