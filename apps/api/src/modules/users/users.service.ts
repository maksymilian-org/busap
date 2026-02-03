import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserInput, UserRoleType } from '@busap/shared';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId?: string) {
    const where = companyId
      ? { companyUsers: { some: { companyId, isActive: true } } }
      : {};

    return this.prisma.user.findMany({
      where,
      include: {
        companyUsers: {
          where: { isActive: true },
          include: { company: true },
        },
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        companyUsers: {
          where: { isActive: true },
          include: { company: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByAppwriteId(appwriteId: string) {
    return this.prisma.user.findUnique({
      where: { appwriteId },
      include: {
        companyUsers: {
          where: { isActive: true },
          include: { company: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateUserInput) {
    const user = await this.findById(id);

    return this.prisma.user.update({
      where: { id: user.id },
      data,
    });
  }

  async assignRole(userId: string, companyId: string, role: UserRoleType) {
    const user = await this.findById(userId);

    // Check if assignment already exists
    const existing = await this.prisma.companyUser.findUnique({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId,
        },
      },
    });

    if (existing) {
      return this.prisma.companyUser.update({
        where: { id: existing.id },
        data: { role, isActive: true },
        include: { company: true, user: true },
      });
    }

    return this.prisma.companyUser.create({
      data: {
        userId: user.id,
        companyId,
        role,
      },
      include: { company: true, user: true },
    });
  }

  async removeRole(userId: string, companyId: string) {
    const user = await this.findById(userId);

    return this.prisma.companyUser.updateMany({
      where: {
        userId: user.id,
        companyId,
      },
      data: { isActive: false },
    });
  }

  async getDriversByCompany(companyId: string) {
    return this.prisma.user.findMany({
      where: {
        companyUsers: {
          some: {
            companyId,
            role: 'driver',
            isActive: true,
          },
        },
      },
    });
  }
}
