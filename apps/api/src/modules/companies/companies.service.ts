import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
}
