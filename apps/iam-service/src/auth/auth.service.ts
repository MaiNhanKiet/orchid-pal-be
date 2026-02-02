import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma'; // Lib prisma của bạn
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GoogleLoginDto } from '@app/common';
import ms from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleGoogleLogin({
    email,
    firstName,
    lastName,
    picture,
    provider,
    deviceAgent,
    ipAddress,
  }: GoogleLoginDto) {
    // 1. Kiểm tra user đã tồn tại trong DB chưa
    let user = await this.prisma.users.findUnique({
      where: { email: email },
    });

    if (!user) {
      user = await this.prisma.users.create({
        data: {
          email: email,
          full_name: `${firstName} ${lastName}`,
          avatar_url: picture,
          password_hash: '',
          phone: '',
        },
      });
    }

    // 2. Tạo JWT Tokens
    const payload = { sub: user.id, email: user.email, role: 'USER' };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION'),
      }),
    ]);

    // Check số lượng refresh token hiện có của user
    const tokenCount = await this.prisma.refresh_tokens.count({
      where: {
        user_id: user.id,
        is_revoked: false,
        expires_at: { gt: new Date() },
      },
    });

    if (tokenCount >= 5) {
      const oldestToken = await this.prisma.refresh_tokens.findFirst({
        where: {
          user_id: user.id,
          is_revoked: false,
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: 'asc' },
      });

      if (oldestToken) {
        await this.prisma.refresh_tokens.delete({
          where: { id: oldestToken.id },
        });
      }
    }

    await this.prisma.refresh_tokens.deleteMany({
      where: {
        user_id: user.id,
        device_agent: deviceAgent,
        ip_address: ipAddress,
      },
    });

    // 3. Lưu refreshToken
    const expiresAt = new Date(
      Date.now() +
        Number(this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRATION')),
    );

    await this.prisma.refresh_tokens.create({
      data: {
        user_id: user.id,
        token: refreshToken,
        expires_at: expiresAt,
        device_agent: deviceAgent,
        ip_address: ipAddress,
      },
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }
}
