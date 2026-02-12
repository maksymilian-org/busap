import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { TokenService, TokenPair } from './token.service';
import { MailerService } from '../mailer/mailer.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private mailerService: MailerService,
  ) {}

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<{ user: Record<string, unknown>; tokens: TokenPair }> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        preferredLanguage: 'pl',
      },
    });

    const tokens = await this.tokenService.generateTokenPair(
      user.id,
      user.email,
      user.systemRole,
    );

    // Send verification email (fire-and-forget)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        type: 'email_verification',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });
    this.mailerService
      .sendVerificationEmail(user.email, verificationToken, user.firstName)
      .catch((err) =>
        this.logger.error(`Failed to send verification email: ${err}`),
      );

    return { user: this.sanitizeUser(user), tokens };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: Record<string, unknown>; tokens: TokenPair }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Update last login timestamp
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.tokenService.generateTokenPair(
      updatedUser.id,
      updatedUser.email,
      updatedUser.systemRole,
    );

    return { user: this.sanitizeUser(updatedUser), tokens };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyUsers: {
          where: { isActive: true },
          include: {
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Transform companyUsers to companyMemberships
    const { companyUsers, ...userData } = user;
    const companyMemberships = companyUsers.map((cu) => ({
      companyId: cu.companyId,
      role: cu.role,
      company: cu.company,
    }));

    return {
      ...this.sanitizeUser(userData),
      companyMemberships,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.tokenService.revokeAllUserTokens(userId);
  }

  async forgotPassword(
    email: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return same message (anti-enumeration)
    const message =
      'Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła.';

    if (!user) {
      return { message };
    }

    // Invalidate old password reset tokens
    await this.prisma.authToken.updateMany({
      where: {
        userId: user.id,
        type: 'password_reset',
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        token,
        type: 'password_reset',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      },
    });

    this.mailerService
      .sendPasswordResetEmail(user.email, token, user.firstName)
      .catch((err) =>
        this.logger.error(`Failed to send password reset email: ${err}`),
      );

    return { message };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const authToken = await this.prisma.authToken.findUnique({
      where: { token },
    });

    if (
      !authToken ||
      authToken.type !== 'password_reset' ||
      authToken.usedAt ||
      authToken.expiresAt < new Date()
    ) {
      throw new BadRequestException(
        'Token jest nieprawidłowy lub wygasł.',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: authToken.userId },
        data: { passwordHash },
      }),
      this.prisma.authToken.update({
        where: { id: authToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: authToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { message: 'Hasło zostało zmienione. Możesz się teraz zalogować.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const authToken = await this.prisma.authToken.findUnique({
      where: { token },
    });

    if (
      !authToken ||
      authToken.type !== 'email_verification' ||
      authToken.usedAt ||
      authToken.expiresAt < new Date()
    ) {
      throw new BadRequestException(
        'Token weryfikacyjny jest nieprawidłowy lub wygasł.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: authToken.userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
      this.prisma.authToken.update({
        where: { id: authToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Email został zweryfikowany.' };
  }

  async resendVerification(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.emailVerified) {
      return { message: 'Email jest już zweryfikowany.' };
    }

    // Invalidate old verification tokens
    await this.prisma.authToken.updateMany({
      where: {
        userId: user.id,
        type: 'email_verification',
        usedAt: null,
      },
      data: { usedAt: new Date() },
    });

    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.authToken.create({
      data: {
        userId: user.id,
        token,
        type: 'email_verification',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    await this.mailerService.sendVerificationEmail(
      user.email,
      token,
      user.firstName,
    );

    return { message: 'Email weryfikacyjny został wysłany ponownie.' };
  }

  private sanitizeUser(user: Record<string, any>): Record<string, unknown> {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
