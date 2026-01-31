import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { Public } from '@app/common';
import { ConfigService } from '@nestjs/config';
import { GoogleOauthGuard } from './guards/google.guard';
import { PrismaService } from '@app/prisma/prisma.service';

@Controller('auth')
@Public()
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthRedirect(@Req() req, @Res() res) {
    const { accessToken, refreshToken } = req.user;

    // 1. Set Refresh Token vào cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log(req.user);

    // 2. Redirect về Frontend Next.js kèm Access Token
    return res.redirect(
      `${this.configService.get<string>('FRONTEND_URL')}?token=${accessToken}`,
    );
  }

  @Get('test')
  async test() {
    const userRoles = await this.prisma.user_roles.findMany({
      where: {
        user_id: 'a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5', // SỬA: Dùng dynamic userId, không hardcode
      },
      select: {
        roles: {
          select: {
            role_permissions: {
              select: {
                permissions: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const permissions = userRoles
      .flatMap((ur) => ur.roles.role_permissions)
      .map((rp) => rp.permissions)
      .map((p) => p.slug)
      .filter((p) => p !== null);

    console.log(permissions);

    return permissions;
  }
}
