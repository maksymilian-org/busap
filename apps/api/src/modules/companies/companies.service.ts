import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCompanyInput, UpdateCompanyInput } from '@busap/shared';
import { Prisma } from '@prisma/client';
import {
  expandRRule,
  getSingleDate,
  filterDatesByModifiers,
  CalendarModifier,
} from '../schedules/utils/rrule.util';
import {
  generateTripsFromSchedule,
} from '../schedules/utils/trip-generator.util';
import { formatDate } from '../calendars/utils/easter.util';

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

    // Validate slug uniqueness if changed
    if (data.slug) {
      const existing = await this.prisma.company.findUnique({
        where: { slug: data.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Slug is already taken');
      }
    }

    // Convert empty strings to null for optional URL fields
    const cleanedData = { ...data } as any;
    for (const field of ['website', 'facebookUrl', 'instagramUrl', 'contactPhone2', 'contactPhone3']) {
      if (cleanedData[field] === '') cleanedData[field] = null;
    }

    return this.prisma.company.update({
      where: { id },
      data: cleanedData,
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

    const [vehicleCount, routeCount, driverCount, memberCount, activeTrips] =
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
        this.prisma.companyUser.count({
          where: { companyId: id, isActive: true },
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
        memberCount,
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

  // ==================== Public Endpoints ====================

  async findBySlugPublic(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        description: true,
        contactEmail: true,
        contactPhone: true,
        contactPhone2: true,
        contactPhone3: true,
        address: true,
        website: true,
        facebookUrl: true,
        instagramUrl: true,
      },
    });

    if (!company || !(await this.isActiveCompany(slug))) {
      throw new NotFoundException(`Company not found`);
    }

    return company;
  }

  async getPublicRoutes(slug: string) {
    const company = await this.getActiveCompanyBySlug(slug);

    return this.prisma.route.findMany({
      where: { companyId: company.id, isActive: true },
      include: {
        currentVersion: {
          include: {
            stops: {
              include: { stop: true },
              orderBy: { sequenceNumber: 'asc' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getPublicDepartures(slug: string, windowHours: number = 24) {
    const company = await this.getActiveCompanyBySlug(slug);

    const now = new Date();
    const windowEnd = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

    // Get active schedules for this company
    const schedules = await this.prisma.tripSchedule.findMany({
      where: {
        companyId: company.id,
        isActive: true,
        validFrom: { lte: windowEnd },
        OR: [
          { validTo: null },
          { validTo: { gte: now } },
        ],
      },
      include: {
        route: {
          include: {
            currentVersion: {
              include: {
                stops: {
                  include: { stop: true },
                  orderBy: { sequenceNumber: 'asc' },
                },
              },
            },
          },
        },
        vehicle: true,
        exceptions: true,
        stopTimes: {
          include: {
            routeStop: { include: { stop: true } },
          },
          orderBy: { routeStop: { sequenceNumber: 'asc' } },
        },
      },
    });

    const departures: any[] = [];

    for (const schedule of schedules) {
      // Expand dates
      let dates: Date[];
      if (schedule.scheduleType === 'single') {
        dates = getSingleDate(schedule.validFrom);
      } else if (schedule.rrule) {
        const modifiers = (schedule.calendarModifiers as unknown as CalendarModifier[]) || [];
        dates = expandRRule(
          schedule.rrule,
          schedule.validFrom,
          schedule.validTo,
          [],
        );
        // Filter by calendar modifiers if present
        if (modifiers.length > 0) {
          // For simplicity, skip calendar resolution in public endpoint
          // Just use exclude_dates type
          dates = filterDatesByModifiers(dates, new Map(), modifiers);
        }
      } else {
        continue;
      }

      // Filter to window
      const windowDates = dates.filter((d) => {
        const dateStr = formatDate(d);
        const todayStr = formatDate(now);
        const endStr = formatDate(windowEnd);
        return dateStr >= todayStr && dateStr <= endStr;
      });

      // Generate trips
      const exceptions = schedule.exceptions.map((ex) => ({
        date: ex.date,
        type: ex.type as 'skip' | 'modify',
        newDepartureTime: ex.newDepartureTime,
        newArrivalTime: ex.newArrivalTime,
        newVehicleId: ex.newVehicleId,
        newDriverId: ex.newDriverId,
        reason: ex.reason,
      }));

      const trips = generateTripsFromSchedule(
        windowDates,
        schedule.departureTime,
        schedule.arrivalTime,
        schedule.vehicleId,
        schedule.driverId,
        exceptions,
      );

      for (const trip of trips) {
        // Parse departure time for sorting
        const [hours, minutes] = trip.departureTime.split(':').map(Number);
        const departureDate = new Date(trip.date);
        departureDate.setHours(hours, minutes, 0, 0);

        // Skip if in the past
        if (departureDate < now) continue;

        departures.push({
          date: trip.date,
          departureTime: trip.departureTime,
          arrivalTime: trip.arrivalTime,
          departureAt: departureDate.toISOString(),
          route: {
            id: schedule.route.id,
            name: schedule.route.name,
            code: schedule.route.code,
          },
          stops: schedule.route.currentVersion?.stops.map((rs) => ({
            id: rs.stop.id,
            name: rs.stop.name,
            city: rs.stop.city,
            sequenceNumber: rs.sequenceNumber,
          })) || [],
          stopTimes: schedule.stopTimes.map((st) => ({
            stopName: st.routeStop.stop.name,
            arrivalTime: st.arrivalTime,
            departureTime: st.departureTime,
          })),
          scheduleName: schedule.name,
        });
      }
    }

    // Sort by departure time
    departures.sort((a, b) => new Date(a.departureAt).getTime() - new Date(b.departureAt).getTime());

    return departures;
  }

  async getPublicNews(slug: string) {
    const company = await this.getActiveCompanyBySlug(slug);

    return this.prisma.companyNews.findMany({
      where: {
        companyId: company.id,
        isActive: true,
        publishedAt: { not: null },
      },
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        imageUrl: true,
        publishedAt: true,
        createdAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    });
  }

  private async isActiveCompany(slug: string): Promise<boolean> {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      select: { isActive: true },
    });
    return company?.isActive === true;
  }

  private async getActiveCompanyBySlug(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
    });

    if (!company || !company.isActive) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }
}
