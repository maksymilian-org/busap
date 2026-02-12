import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { UserRole } from '@busap/shared';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private mailer: MailerService,
  ) {}

  // ==================== Users ====================

  async listUsers(params: {
    search?: string;
    systemRole?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.systemRole) where.systemRole = params.systemRole;
    if (params.isActive !== undefined) where.isActive = params.isActive;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          companyUsers: {
            where: { isActive: true },
            include: { company: { select: { id: true, name: true, slug: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit || 20,
        skip: params.offset || 0,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => this.sanitizeUser(u)),
      total,
      limit: params.limit || 20,
      offset: params.offset || 0,
    };
  }

  async getUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyUsers: {
          include: { company: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    systemRole?: string;
    preferredLanguage?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        systemRole: data.systemRole || 'passenger',
        preferredLanguage: data.preferredLanguage || 'pl',
      },
    });

    return this.sanitizeUser(user);
  }

  async updateUser(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      systemRole?: string;
      preferredLanguage?: string;
      isActive?: boolean;
    },
    currentUser: { isSuperadmin: boolean },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Admin cannot change superadmin's role or deactivate them
    if (user.systemRole === UserRole.SUPERADMIN && !currentUser.isSuperadmin) {
      throw new ForbiddenException('Cannot modify superadmin account');
    }

    // Only superadmin can set systemRole to superadmin
    if (data.systemRole === UserRole.SUPERADMIN && !currentUser.isSuperadmin) {
      throw new ForbiddenException('Only superadmin can promote to superadmin');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.sanitizeUser(updated);
  }

  async deleteUser(
    userId: string,
    currentUser: { id: string; isSuperadmin: boolean },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Cannot delete yourself
    if (userId === currentUser.id) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    // Admin cannot delete superadmin
    if (user.systemRole === UserRole.SUPERADMIN && !currentUser.isSuperadmin) {
      throw new ForbiddenException('Cannot delete superadmin account');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return { message: 'User deactivated successfully' };
  }

  // ==================== Invitations ====================

  async createInvitation(
    data: {
      email: string;
      role?: string;
      companyId?: string;
      companyRole?: string;
    },
    invitedById: string,
  ) {
    // Check if user already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if pending invitation already exists
    const pendingInvitation = await this.prisma.invitation.findFirst({
      where: {
        email: data.email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (pendingInvitation) {
      throw new ConflictException('Pending invitation already exists for this email');
    }

    // Validate company exists if companyId provided
    if (data.companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: data.companyId },
      });
      if (!company) throw new NotFoundException('Company not found');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Get inviter details and optional company name
    const [inviter, company] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: invitedById },
        select: { firstName: true, lastName: true },
      }),
      data.companyId
        ? this.prisma.company.findUnique({
            where: { id: data.companyId },
            select: { name: true },
          })
        : null,
    ]);

    const invitation = await this.prisma.invitation.create({
      data: {
        email: data.email,
        token,
        role: data.role || 'passenger',
        companyId: data.companyId,
        companyRole: data.companyRole,
        invitedById,
        expiresAt,
      },
    });

    // Send invitation email
    const inviterName = inviter
      ? `${inviter.firstName} ${inviter.lastName}`
      : 'Administrator';
    await this.mailer.sendInvitationEmail(
      data.email,
      token,
      inviterName,
      data.role,
      company?.name,
    );

    return {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      role: invitation.role,
      companyId: invitation.companyId,
      companyRole: invitation.companyRole,
      expiresAt: invitation.expiresAt,
      invitationUrl: `/register?token=${invitation.token}`,
    };
  }

  async verifyInvitation(token: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token },
      include: {
        invitedBy: { select: { firstName: true, lastName: true } },
      },
    });

    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.acceptedAt) throw new BadRequestException('Invitation already accepted');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('Invitation expired');

    return {
      email: invitation.email,
      role: invitation.role,
      companyRole: invitation.companyRole,
      expiresAt: invitation.expiresAt,
      invitedBy: invitation.invitedBy,
    };
  }

  async acceptInvitation(data: {
    token: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { token: data.token },
    });

    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.acceptedAt) throw new BadRequestException('Invitation already accepted');
    if (invitation.expiresAt < new Date()) throw new BadRequestException('Invitation expired');

    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user and mark invitation as accepted in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          systemRole: invitation.role === UserRole.ADMIN ? UserRole.ADMIN : 'passenger',
        },
      });

      // Assign company role if specified
      if (invitation.companyId && invitation.companyRole) {
        await tx.companyUser.create({
          data: {
            userId: newUser.id,
            companyId: invitation.companyId,
            role: invitation.companyRole,
          },
        });
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return newUser;
    });

    return this.sanitizeUser(user);
  }

  async listInvitations(params: {
    status?: 'pending' | 'accepted' | 'expired';
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (params.status === 'pending') {
      where.acceptedAt = null;
      where.expiresAt = { gt: new Date() };
    } else if (params.status === 'accepted') {
      where.acceptedAt = { not: null };
    } else if (params.status === 'expired') {
      where.acceptedAt = null;
      where.expiresAt = { lt: new Date() };
    }

    const [invitations, total] = await Promise.all([
      this.prisma.invitation.findMany({
        where,
        include: {
          invitedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit || 20,
        skip: params.offset || 0,
      }),
      this.prisma.invitation.count({ where }),
    ]);

    // Add computed status field
    const now = new Date();
    const invitationsWithStatus = invitations.map((inv) => ({
      ...inv,
      status: inv.acceptedAt
        ? 'accepted'
        : inv.expiresAt < now
          ? 'expired'
          : 'pending',
    }));

    return { data: invitationsWithStatus, total, limit: params.limit || 20, offset: params.offset || 0 };
  }

  async revokeInvitation(invitationId: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.acceptedAt) throw new BadRequestException('Cannot revoke accepted invitation');

    await this.prisma.invitation.delete({ where: { id: invitationId } });
    return { message: 'Invitation revoked' };
  }

  // ==================== Company Role Management ====================

  async assignCompanyRole(data: {
    userId: string;
    companyId: string;
    role: string;
  }) {
    const [user, company] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: data.userId } }),
      this.prisma.company.findUnique({ where: { id: data.companyId } }),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!company) throw new NotFoundException('Company not found');

    const existing = await this.prisma.companyUser.findUnique({
      where: { userId_companyId: { userId: data.userId, companyId: data.companyId } },
    });

    if (existing) {
      const updated = await this.prisma.companyUser.update({
        where: { id: existing.id },
        data: { role: data.role, isActive: true },
        include: { company: true, user: true },
      });
      return updated;
    }

    const companyUser = await this.prisma.companyUser.create({
      data: {
        userId: data.userId,
        companyId: data.companyId,
        role: data.role,
      },
      include: { company: true, user: true },
    });

    return companyUser;
  }

  async removeCompanyRole(userId: string, companyId: string) {
    const companyUser = await this.prisma.companyUser.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });

    if (!companyUser) throw new NotFoundException('Company role not found');

    await this.prisma.companyUser.update({
      where: { id: companyUser.id },
      data: { isActive: false },
    });

    return { message: 'Company role removed' };
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats() {
    const [
      totalUsers,
      activeUsers,
      totalCompanies,
      activeCompanies,
      totalRoutes,
      totalVehicles,
      totalTrips,
      activeTrips,
      pendingInvitations,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.company.count(),
      this.prisma.company.count({ where: { isActive: true } }),
      this.prisma.route.count(),
      this.prisma.vehicle.count(),
      this.prisma.trip.count(),
      this.prisma.trip.count({ where: { status: 'in_progress' } }),
      this.prisma.invitation.count({
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
      }),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers },
      companies: { total: totalCompanies, active: activeCompanies },
      routes: { total: totalRoutes },
      vehicles: { total: totalVehicles },
      trips: { total: totalTrips, active: activeTrips },
      invitations: { pending: pendingInvitations },
    };
  }

  // ==================== Helpers ====================

  private sanitizeUser(user: Record<string, any>): Record<string, unknown> {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
