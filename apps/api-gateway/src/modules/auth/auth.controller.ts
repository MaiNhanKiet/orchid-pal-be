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
import { MICROSERVICES_CLIENTS, Public } from '@app/common';
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
  ) {}

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  @ApiGoogleAuthDocs()
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  @ApiGoogleAuthCallbackDocs()
  async googleAuthRedirect(@Req() req, @Res() res) {
    const { accessToken, refreshToken } = req.user;

    if (refreshToken) {
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    console.log(`token=${accessToken}`);
    

    return res.redirect(
      `${this.configService.get<string>('FRONTEND_URL')}?token=${accessToken}`,
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
      secure: true,
      sameSite: 'lax',
      path: '/auth/refresh',
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

  @Post('test')
  async test(@Body('otp') otp: string) {
    const key = `otp:${otp}`;
    console.log(otp);
    return this.redisService.set(key, otp, 300);
  }

  @Get('test')
  async get() {
    return this.redisService.get<string>('otp');
  }
}
