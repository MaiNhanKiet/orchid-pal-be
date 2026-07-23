import { GoogleLoginDto } from '@app/common';
import { PrismaService } from '@app/prisma';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';

type UserWithRoles = NonNullable<Awaited<ReturnType<AuthService['findUserByEmail']>>>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleGoogleLogin(dto: GoogleLoginDto) {
    let user = await this.findUserByEmail(dto.email);

    if (!user) {
      try {
        user = await this.createGoogleUser(dto);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          // Race: another request created the user — continue as login.
          user = await this.findUserByEmail(dto.email);
          if (!user) throw error;
        } else {
          throw error;
        }
      }
    }

    const syncedUser = await this.syncAvatarIfNeeded(user, dto.picture);
    return this.issueAuthTokens(syncedUser, dto.deviceAgent, dto.ipAddress);
  }

  private async findUserByEmail(email: string) {
    return this.prisma.users.findUnique({
      where: { email },
      include: {
        user_roles: {
          include: { roles: true },
        },
      },
    });
  }

  private async syncAvatarIfNeeded(
    user: NonNullable<UserWithRoles>,
    picture?: string,
  ) {
    if (!picture || user.avatar_url === picture) {
      return user;
    }

    return this.prisma.users.update({
      where: { id: user.id },
      data: { avatar_url: picture },
      include: {
        user_roles: {
          include: { roles: true },
        },
      },
    });
  }

  private async createGoogleUser({
    email,
    firstName,
    lastName,
    picture,
  }: GoogleLoginDto) {
    const defaultRoleName =
      this.configService.get<string>('DEFAULT_USER_ROLE')!;
    const defaultRole = await this.prisma.roles.findUnique({
      where: { name: defaultRoleName.toLocaleUpperCase() },
    });

    if (!defaultRole) {
      throw new Error(`Default role '${defaultRoleName}' not found in DB`);
    }

    return this.prisma.users.create({
      data: {
        email,
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

  private async issueAuthTokens(
    user: NonNullable<UserWithRoles>,
    deviceAgent?: string,
    ipAddress?: string,
  ) {
    const defaultRoleName =
      this.configService.get<string>('DEFAULT_USER_ROLE')!;
    const roleNames = user.user_roles.map((ur) => ur.roles.name);
    const finalRoles = roleNames.length > 0 ? roleNames : [defaultRoleName];

    const payload = {
      sub: user.id,
      email: user.email,
      role: finalRoles,
      full_name: user.full_name ?? undefined,
      avatar_url: user.avatar_url ?? undefined,
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

    const expiresAt = new Date(
      Date.now() +
        Number(this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRATION')),
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.refresh_tokens.deleteMany({
        where: {
          user_id: user.id,
          device_agent: deviceAgent,
          ip_address: ipAddress,
        },
      });

      const activeTokens = await tx.refresh_tokens.findMany({
        where: {
          user_id: user.id,
          is_revoked: false,
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: 'asc' },
        select: { id: true },
      });

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

  async refreshToken({
    oldRefreshToken,
    deviceAgent,
    ipAddress,
  }: {
    oldRefreshToken: string;
    deviceAgent: string;
    ipAddress: string;
  }) {
    try {
      await this.jwtService.verifyAsync(oldRefreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token is invalid or has expired',
      );
    }

    const storedToken = await this.prisma.refresh_tokens.findUnique({
      where: { token: oldRefreshToken },
      include: { users: true },
    });

    if (!storedToken || storedToken.is_revoked) {
      throw new UnauthorizedException('Refresh token does not exist');
    }

    if (storedToken.expires_at < new Date()) {
      await this.prisma.refresh_tokens.delete({
        where: { id: storedToken.id },
      });
      throw new UnauthorizedException('Refresh token has expired');
    }

    const userId = storedToken.user_id;
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_roles: {
          include: { roles: true },
        },
      },
    });

    if (!user) throw new UnauthorizedException('User does not exist');

    const defaultRoleName =
      this.configService.get<string>('DEFAULT_USER_ROLE')!;
    const roleNames = user.user_roles.map((ur) => ur.roles.name);
    const finalRoles = roleNames.length > 0 ? roleNames : [defaultRoleName];

    const payload = {
      sub: user.id,
      email: user.email,
      role: finalRoles,
      full_name: user.full_name ?? undefined,
      avatar_url: user.avatar_url ?? undefined,
    };

    const [newAccessToken, newRefreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION'),
      }),
    ]);

    const expiresAt = new Date(
      Date.now() +
        Number(this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRATION')),
    );
    await this.prisma.$transaction(async (tx) => {
      await tx.refresh_tokens.delete({
        where: { id: storedToken.id },
      });

      await tx.refresh_tokens.create({
        data: {
          user_id: user.id,
          token: newRefreshToken,
          expires_at: expiresAt,
          device_agent: deviceAgent,
          ip_address: ipAddress,
        },
      });
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout({ refreshToken }: { refreshToken: string }) {
    await this.prisma.refresh_tokens.deleteMany({
      where: { token: refreshToken },
    });
    return true;
  }
}
