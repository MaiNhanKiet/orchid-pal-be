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
    deviceAgent,
    ipAddress,
  }: GoogleLoginDto) {
    // 1. Kiểm tra user đã tồn tại trong DB chưa
    let user = await this.prisma.users.findUnique({
      where: { email: email },
      include: {
        user_roles: {
          include: {
            roles: true,
          },
        },
      },
    });

    // 2. Nếu chưa có thì tạo mới user với role mặc định
    const defaultRoleName =
      this.configService.get<string>('DEFAULT_USER_ROLE')!;
    if (!user) {
      const defaultRole = await this.prisma.roles.findUnique({
        where: { name: defaultRoleName.toLocaleUpperCase() },
      });

      if (!defaultRole)
        throw new Error(`Default role '${defaultRoleName}' not found in DB`);

      user = await this.prisma.users.create({
        data: {
          email: email,
          full_name: lastName ? `${firstName} ${lastName}` : firstName,
          avatar_url: picture,
          password_hash: '',
          phone: '',
          user_roles: {
            create: {
              role_id: defaultRole.id,
            },
          },
        },
        include: {
          user_roles: {
            include: { roles: true },
          },
        },
      });
    }

    // 3. Tạo JWT Access Token và Refresh Token
    const roleNames = user.user_roles.map((ur) => ur.roles.name);
    const finalRoles = roleNames.length > 0 ? roleNames : [defaultRoleName];

    const payload = {
      sub: user.id,
      email: user.email,
      role: finalRoles,
    };

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

    // 4. Xóa rf nếu vượt quá 5
    // Giới hạn mỗi user chỉ có 5 rf token active cùng lúc
    // Lưu token vào DB
    const expiresAt = new Date(
      Date.now() +
        Number(this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRATION')),
    );

    await this.prisma.$transaction(async (tx) => {
      // xóa các token cũ cùng deviceAgent và ipAddress
      await tx.refresh_tokens.deleteMany({
        where: {
          user_id: user.id,
          device_agent: deviceAgent,
          ip_address: ipAddress,
        },
      });

      // 2. Lấy danh sách các token hiện tại của user (chưa bị thu hồi và chưa hết hạn)
      const activeTokens = await tx.refresh_tokens.findMany({
        where: {
          user_id: user.id,
          is_revoked: false,
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: 'asc' },
        select: { id: true },
      });

      // quá 4 thì xóa token cũ nhất
      if (activeTokens.length >= 5) {
        const tokensToDeleteCount = activeTokens.length - 4;
        const idsToDelete = activeTokens
          .slice(0, tokensToDeleteCount)
          .map((t) => t.id);

        if (idsToDelete.length > 0) {
          await tx.refresh_tokens.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }
      }

      // Lưu rf token mới vào DB
      await tx.refresh_tokens.create({
        data: {
          user_id: user.id,
          token: refreshToken,
          expires_at: expiresAt,
          device_agent: deviceAgent,
          ip_address: ipAddress,
        },
      });
    });

    return {
      user,
      accessToken,
      refreshToken,
    };
  }
}
