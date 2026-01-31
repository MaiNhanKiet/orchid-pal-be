import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma'; // Lib prisma của bạn
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GoogleLoginDto } from '@app/common';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // async handleGoogleLogin(socialUser: GoogleLoginDto) {
  //   // 1. Kiểm tra user đã tồn tại trong DB chưa
  //   let user = await this.prisma.user.findUnique({
  //     where: { email: socialUser.email },
  //   });

  //   if (!user) {
  //     user = await this.prisma.user.create({
  //       data: {
  //         email: socialUser.email,
  //         name: `${socialUser.firstName} ${socialUser.lastName}`,
  //         password: '',
  //         provider: socialUser.provider,
  //         avatar: socialUser.picture,
  //       },
  //     });
  //   }

  //   // 2. Tạo JWT Tokens
  //   const payload = { sub: user.id, email: user.email, role: 'USER' };

  //   const [accessToken, refreshToken] = await Promise.all([
  //     this.jwtService.signAsync(payload, {
  //       secret: this.configService.get('JWT_ACCESS_SECRET'),
  //       expiresIn: '15m',
  //     }),
  //     this.jwtService.signAsync(payload, {
  //       secret: this.configService.get('JWT_REFRESH_SECRET'),
  //       expiresIn: '7d',
  //     }),
  //   ]);

  //   // 3. Lưu refreshToken đã hash vào DB (ở đây chưa hash để đơn giản)
  //   await this.prisma.user.update({
  //     where: { id: user.id },
  //     data: { hashedRefreshToken: refreshToken },
  //   });

  //   return {
  //     user,
  //     accessToken,
  //     refreshToken,
  //   };
  // }
}
