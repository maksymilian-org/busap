import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateRouteInput,
  UpdateRouteInput,
  CreateRouteVersionInput,
  CreateRouteExceptionInput,
} from '@busap/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId?: string) {
    return this.prisma.route.findMany({
      where: {
        isActive: true,
        ...(companyId && { companyId }),
      },
      include: {
        company: true,
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

  async findById(id: string) {
    const route = await this.prisma.route.findUnique({
      where: { id },
      include: {
        company: true,
        currentVersion: {
          include: {
            stops: {
              include: { stop: true },
              orderBy: { sequenceNumber: 'asc' },
            },
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 5,
        },
        exceptions: {
          where: {
            isActive: true,
            OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
          },
        },
      },
    });

    if (!route) {
      throw new NotFoundException(`Route with ID ${id} not found`);
    }

    return route;
  }

  async create(data: CreateRouteInput) {
    return this.prisma.route.create({
      data,
      include: { company: true },
    });
  }

  async update(id: string, data: UpdateRouteInput) {
    await this.findById(id);

    return this.prisma.route.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.route.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async createVersion(data: CreateRouteVersionInput) {
    const route = await this.findById(data.routeId);

    // Get next version number
    const lastVersion = await this.prisma.routeVersion.findFirst({
      where: { routeId: data.routeId },
      orderBy: { versionNumber: 'desc' },
    });

    const versionNumber = (lastVersion?.versionNumber ?? 0) + 1;

    // Validate stops
    if (data.stops.length < 2) {
      throw new BadRequestException('Route must have at least 2 stops');
    }

    // Create version with stops
    const version = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Deactivate previous current version
      if (route.currentVersionId) {
        await tx.routeVersion.update({
          where: { id: route.currentVersionId },
          data: { isActive: false },
        });
      }

      // Create new version
      const newVersion = await tx.routeVersion.create({
        data: {
          routeId: data.routeId,
          versionNumber,
          validFrom: data.validFrom,
          validTo: data.validTo,
          stops: {
            create: data.stops.map((stop) => ({
              stopId: stop.stopId,
              sequenceNumber: stop.sequenceNumber,
              distanceFromStart: stop.distanceFromStart,
              durationFromStart: stop.durationFromStart,
              isPickup: stop.isPickup ?? true,
              isDropoff: stop.isDropoff ?? true,
            })),
          },
        },
        include: {
          stops: {
            include: { stop: true },
            orderBy: { sequenceNumber: 'asc' },
          },
        },
      });

      // Update route's current version
      await tx.route.update({
        where: { id: data.routeId },
        data: { currentVersionId: newVersion.id },
      });

      return newVersion;
    });

    return version;
  }

  async createException(data: CreateRouteExceptionInput) {
    await this.findById(data.routeId);

    return this.prisma.routeException.create({
      data,
    });
  }

  async getActiveExceptions(routeId: string) {
    return this.prisma.routeException.findMany({
      where: {
        routeId,
        isActive: true,
        validFrom: { lte: new Date() },
        OR: [{ validTo: null }, { validTo: { gte: new Date() } }],
      },
    });
  }

  async searchRoutes(fromStopId: string, toStopId: string, companyId?: string) {
    // Find routes that have both stops in correct order
    const routes = await this.prisma.route.findMany({
      where: {
        isActive: true,
        ...(companyId && { companyId }),
        currentVersion: {
          stops: {
            some: { stopId: fromStopId },
          },
        },
      },
      include: {
        company: true,
        currentVersion: {
          include: {
            stops: {
              include: { stop: true },
              orderBy: { sequenceNumber: 'asc' },
            },
          },
        },
      },
    });

    // Filter routes where fromStop comes before toStop
    return routes.filter((route: typeof routes[number]) => {
      const stops = route.currentVersion?.stops ?? [];
      const fromIndex = stops.findIndex((s: { stopId: string }) => s.stopId === fromStopId);
      const toIndex = stops.findIndex((s: { stopId: string }) => s.stopId === toStopId);
      return fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex;
    });
  }
}
