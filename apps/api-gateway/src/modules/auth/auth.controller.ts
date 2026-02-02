import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { Public } from '@app/common';
import { ConfigService } from '@nestjs/config';
import { GoogleOauthGuard } from './guards/google.guard';
import { PrismaService } from '@app/prisma/prisma.service';
import { ApiTags } from '@nestjs/swagger';
import { ApiGoogleAuthDocs, ApiGoogleAuthCallbackDocs } from './auth.swagger';

@ApiTags('Auth')
@Controller('auth')
@Public()
export class AuthController {
  constructor(private readonly configService: ConfigService) {}

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

    return res.redirect(
      `${this.configService.get<string>('FRONTEND_URL')}?token=${accessToken}`,
    );
  }
}
