import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyInput, UpdateCompanyInput } from '@busap/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.company.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        companyUsers: {
          where: { isActive: true },
          include: { user: true },
        },
        vehicles: { where: { isActive: true } },
        routes: { where: { isActive: true } },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  async findBySlug(slug: string) {
    return this.prisma.company.findUnique({
      where: { slug },
    });
  }

  async create(data: CreateCompanyInput, ownerId: string) {
    // Generate slug from name
    const slug = this.generateSlug(data.name);

    // Check if slug already exists
    const existing = await this.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`Company with slug "${slug}" already exists`);
    }

    // Create company and assign owner
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const company = await tx.company.create({
        data: {
          ...data,
          slug,
        },
      });

      // Assign creator as owner
      await tx.companyUser.create({
        data: {
          userId: ownerId,
          companyId: company.id,
          role: 'owner',
        },
      });

      return company;
    });
  }

  async update(id: string, data: UpdateCompanyInput) {
    await this.findById(id);

    return this.prisma.company.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.company.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getStats(id: string) {
    const company = await this.findById(id);

    const [vehicleCount, routeCount, driverCount, activeTrips] =
      await Promise.all([
        this.prisma.vehicle.count({
          where: { companyId: id, isActive: true },
        }),
        this.prisma.route.count({
          where: { companyId: id, isActive: true },
        }),
        this.prisma.companyUser.count({
          where: { companyId: id, role: 'driver', isActive: true },
        }),
        this.prisma.trip.count({
          where: { companyId: id, status: 'in_progress' },
        }),
      ]);

    return {
      company,
      stats: {
        vehicleCount,
        routeCount,
        driverCount,
        activeTrips,
      },
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // ==================== Company Members ====================

  async getMembers(companyId: string) {
    await this.findById(companyId);

    const members = await this.prisma.companyUser.findMany({
      where: { companyId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatarUrl: true,
            isActive: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
      user: m.user,
    }));
  }

  async addMember(companyId: string, userId: string, role: string) {
    await this.findById(companyId);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if already a member
    const existing = await this.prisma.companyUser.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('User is already a member of this company');
      }
      // Reactivate membership
      return this.prisma.companyUser.update({
        where: { id: existing.id },
        data: { role, isActive: true },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      });
    }

    return this.prisma.companyUser.create({
      data: { userId, companyId, role },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
  }

  async updateMemberRole(companyId: string, userId: string, newRole: string) {
    const member = await this.prisma.companyUser.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });

    if (!member || !member.isActive) {
      throw new NotFoundException('Member not found');
    }

    // If changing from owner, ensure there's another owner
    if (member.role === 'owner' && newRole !== 'owner') {
      const ownerCount = await this.prisma.companyUser.count({
        where: { companyId, role: 'owner', isActive: true },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Company must have at least one owner');
      }
    }

    return this.prisma.companyUser.update({
      where: { id: member.id },
      data: { role: newRole },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
  }

  async removeMember(companyId: string, userId: string) {
    const member = await this.prisma.companyUser.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });

    if (!member || !member.isActive) {
      throw new NotFoundException('Member not found');
    }

    // Cannot remove the last owner
    if (member.role === 'owner') {
      const ownerCount = await this.prisma.companyUser.count({
        where: { companyId, role: 'owner', isActive: true },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the last owner');
      }
    }

    await this.prisma.companyUser.update({
      where: { id: member.id },
      data: { isActive: false },
    });

    return { message: 'Member removed successfully' };
  }

  async getAvailableUsers(companyId: string, search?: string) {
    // Get existing member IDs
    const existingMembers = await this.prisma.companyUser.findMany({
      where: { companyId, isActive: true },
      select: { userId: true },
    });
    const existingUserIds = existingMembers.map((m) => m.userId);

    const where: any = {
      id: { notIn: existingUserIds },
      isActive: true,
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
      take: 20,
      orderBy: { firstName: 'asc' },
    });

    return users;
  }

  async isCompanyOwner(companyId: string, userId: string): Promise<boolean> {
    const membership = await this.prisma.companyUser.findUnique({
      where: { userId_companyId: { userId, companyId } },
    });
    return membership?.isActive === true && membership?.role === 'owner';
  }
}
