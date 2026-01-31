import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma'; // Lib prisma của bạn
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GoogleLoginDto } from '@app/common';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleGoogleLogin(socialUser: GoogleLoginDto) {
    // 1. Kiểm tra user đã tồn tại trong DB chưa
    let user = await this.prisma.users.findUnique({
      where: { email: socialUser.email },
    });

    if (!user) {
      user = await this.prisma.users.create({
        data: {
          email: socialUser.email,
          full_name: `${socialUser.firstName} ${socialUser.lastName}`,
          avatar_url: socialUser.picture,
          password_hash: '',
          phone: '',
        },
      });
    }

    // 2. Tạo JWT Tokens
    const payload = { sub: user.id, email: user.email, role: 'USER' };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    // 3. Lưu refreshToken đã hash vào DB (ở đây chưa hash để đơn giản)
    // lưu vào redis

    return {
      user,
      accessToken,
      refreshToken,
    };
  }
}
