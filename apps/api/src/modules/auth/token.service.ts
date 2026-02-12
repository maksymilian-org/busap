import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  systemRole?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async generateTokenPair(userId: string, email: string, systemRole?: string): Promise<TokenPair> {
    const payload: JwtPayload = { sub: userId, email, systemRole };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = randomUUID();
    const family = randomUUID();

    const tokenHash = await bcrypt.hash(refreshToken, 10);

    const expiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = new Date(
      Date.now() + this.parseDuration(expiresIn),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        family,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: `${family}:${refreshToken}` };
  }

  async refreshTokens(rawRefreshToken: string): Promise<TokenPair> {
    const [family, token] = rawRefreshToken.split(':');
    if (!family || !token) {
      throw new Error('Invalid refresh token format');
    }

    // Find all tokens in this family
    const familyTokens = await this.prisma.refreshToken.findMany({
      where: { family },
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });

    if (familyTokens.length === 0) {
      throw new Error('Invalid refresh token');
    }

    const latestToken = familyTokens[0];

    // If latest token is revoked, this is a reuse attack — revoke entire family
    if (latestToken.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { family },
        data: { revokedAt: new Date() },
      });
      throw new Error('Token reuse detected, all sessions revoked');
    }

    // Check expiry
    if (latestToken.expiresAt < new Date()) {
      throw new Error('Refresh token expired');
    }

    // Verify hash
    const isValid = await bcrypt.compare(token, latestToken.tokenHash);
    if (!isValid) {
      throw new Error('Invalid refresh token');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: latestToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new pair with same family
    const payload: JwtPayload = {
      sub: latestToken.userId,
      email: latestToken.user.email,
      systemRole: latestToken.user.systemRole,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const newRefreshToken = randomUUID();
    const newTokenHash = await bcrypt.hash(newRefreshToken, 10);

    const expiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = new Date(
      Date.now() + this.parseDuration(expiresIn),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: latestToken.userId,
        tokenHash: newTokenHash,
        family,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: `${family}:${newRefreshToken}`,
    };
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
