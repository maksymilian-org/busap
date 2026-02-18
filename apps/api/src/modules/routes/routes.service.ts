import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateRouteInput,
  UpdateRouteInput,
  CreateRouteVersionInput,
  CreateRouteExceptionInput,
  RoutePreviewInput,
  RoutePreviewResult,
} from '@busap/shared';
import { Prisma } from '@prisma/client';
import { OrsService } from '../ors/ors.service';

@Injectable()
export class RoutesService {
  private readonly logger = new Logger(RoutesService.name);

  constructor(
    private prisma: PrismaService,
    private orsService: OrsService,
  ) {}

  /**
   * Generate route name from stop cities.
   * Format: "City1 - CityN" or "City1 - CityN (via City2, City3)"
   */
  private generateRouteName(stops: Array<{ stop?: { name: string; city?: string | null } | null }>): string {
    // Extract unique city names in sequence order, fall back to stop name
    const cities: string[] = [];
    for (const s of stops) {
      const cityName = s.stop?.city || s.stop?.name || '';
      if (cityName && cities[cities.length - 1] !== cityName) {
        cities.push(cityName);
      }
    }

    if (cities.length === 0) return '';
    if (cities.length === 1) return cities[0];

    const first = cities[0];
    const last = cities[cities.length - 1];
    const via = cities.slice(1, -1);

    if (via.length === 0) {
      return `${first} - ${last}`;
    }
    return `${first} - ${last} (via ${via.join(', ')})`;
  }

  async findAll(companyId?: string, favoritesOnly = true) {
    const createdBySelect = {
      select: { id: true, firstName: true, lastName: true },
    };
    const routeInclude = {
      company: true,
      createdBy: createdBySelect,
      currentVersion: {
        include: {
          stops: {
            include: { stop: true },
            orderBy: { sequenceNumber: 'asc' as const },
          },
        },
      },
    };

    if (favoritesOnly && companyId) {
      // Return only favorite routes for this company
      const favorites = await this.prisma.companyFavoriteRoute.findMany({
        where: { companyId },
        include: { route: { include: routeInclude } },
      });
      return favorites
        .map((f) => ({ ...f.route, isFavorite: true }))
        .filter((r) => r.isActive)
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    const routes = await this.prisma.route.findMany({
      where: {
        isActive: true,
        ...(companyId && { companyId }),
      },
      include: routeInclude,
      orderBy: { name: 'asc' },
    });

    if (companyId) {
      const favoriteRouteIds = new Set(
        (
          await this.prisma.companyFavoriteRoute.findMany({
            where: { companyId },
            select: { routeId: true },
          })
        ).map((f) => f.routeId),
      );
      return routes.map((route) => ({ ...route, isFavorite: favoriteRouteIds.has(route.id) }));
    }

    return routes;
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

  async create(data: CreateRouteInput, userId?: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const route = await tx.route.create({
        data: {
          ...data,
          ...(userId && { createdById: userId }),
        },
        include: { company: true },
      });

      // Auto-add to company favorites if the user belongs to a company
      if (userId) {
        const companyUser = await tx.companyUser.findFirst({
          where: { userId, isActive: true },
        });

        if (companyUser) {
          await tx.companyFavoriteRoute.create({
            data: {
              companyId: companyUser.companyId,
              routeId: route.id,
              addedById: userId,
            },
          });
        }
      }

      return route;
    });
  }

  async update(id: string, data: UpdateRouteInput, dbUser?: any) {
    await this.findById(id);

    // Only admin/superadmin can manually change route name
    if (data.name !== undefined && dbUser) {
      const isAdmin = dbUser.systemRole === 'admin' || dbUser.systemRole === 'superadmin';
      if (!isAdmin) {
        throw new ForbiddenException('Only admins can manually change route name');
      }
      data.nameOverridden = true;
    }

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

  async addFavorite(companyId: string, routeId: string, userId: string) {
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) {
      throw new NotFoundException(`Route with ID ${routeId} not found`);
    }

    try {
      return await this.prisma.companyFavoriteRoute.create({
        data: {
          companyId,
          routeId,
          addedById: userId,
        },
        include: { route: true },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Route is already a favorite for this company');
      }
      throw error;
    }
  }

  async removeFavorite(companyId: string, routeId: string) {
    const favorite = await this.prisma.companyFavoriteRoute.findUnique({
      where: {
        companyId_routeId: { companyId, routeId },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    return this.prisma.companyFavoriteRoute.delete({
      where: { id: favorite.id },
    });
  }

  async getFavorites(companyId: string) {
    return this.prisma.companyFavoriteRoute.findMany({
      where: { companyId },
      include: { route: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async previewGeometry(input: RoutePreviewInput): Promise<RoutePreviewResult | null> {
    return this.orsService.computeRouteGeometry(input.stops, input.waypoints || {});
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

    // Fetch stop coordinates for ORS
    const sortedStops = [...data.stops].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    const stopIds = sortedStops.map((s) => s.stopId);
    const dbStops = await this.prisma.stop.findMany({
      where: { id: { in: stopIds } },
      select: { id: true, latitude: true, longitude: true },
    });
    const stopMap = new Map(dbStops.map((s) => [s.id, s]));
    const stopCoords = sortedStops
      .map((s) => stopMap.get(s.stopId))
      .filter((s): s is { id: string; latitude: number; longitude: number } => !!s);

    // Compute route geometry via ORS (non-fatal on failure)
    let orsResult: RoutePreviewResult | null = null;
    try {
      orsResult = await this.orsService.computeRouteGeometry(
        stopCoords,
        data.waypoints || {},
      );
    } catch (error) {
      this.logger.warn('ORS geometry computation failed, saving version without geometry', error);
    }

    // Enrich stop distances/durations from ORS data
    const enrichedStops = sortedStops.map((stop, index) => {
      let distanceFromStart = stop.distanceFromStart;
      let durationFromStart = stop.durationFromStart;

      if (orsResult && index > 0) {
        // Cumulative sum of segment distances/durations up to this stop
        distanceFromStart = orsResult.segmentDistances.slice(0, index).reduce((a, b) => a + b, 0);
        durationFromStart = Math.round(orsResult.segmentDurations.slice(0, index).reduce((a, b) => a + b, 0) / 60); // seconds → minutes
      }

      return {
        stopId: stop.stopId,
        sequenceNumber: stop.sequenceNumber,
        distanceFromStart,
        durationFromStart,
        isPickup: stop.isPickup ?? true,
        isDropoff: stop.isDropoff ?? true,
        isMain: stop.isMain ?? false,
      };
    });

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
          ...(orsResult && {
            geometry: orsResult.geometry as any,
            totalDistance: orsResult.totalDistance,
            totalDuration: orsResult.totalDuration,
          }),
          waypoints: data.waypoints || {},
          stops: {
            create: enrichedStops,
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
      const updateData: any = { currentVersionId: newVersion.id };

      // Auto-generate route name if not manually overridden
      if (!route.nameOverridden) {
        const generatedName = this.generateRouteName(newVersion.stops);
        if (generatedName) {
          updateData.name = generatedName;
        }
      }

      await tx.route.update({
        where: { id: data.routeId },
        data: updateData,
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

  async duplicate(routeId: string, userId?: string) {
    const original = await this.findById(routeId);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Generate name from stops or fall back to copy suffix
      const generatedName = original.currentVersion?.stops?.length
        ? this.generateRouteName(original.currentVersion.stops)
        : '';
      const routeName = generatedName || `${original.name} (kopia)`;

      // Create new route with nameOverridden=false
      const newRoute = await tx.route.create({
        data: {
          companyId: original.companyId,
          name: routeName,
          nameOverridden: false,
          code: original.code ? `${original.code}-copy` : null,
          description: original.description,
          comment: (original as any).comment || null,
          type: original.type,
          ...(userId && { createdById: userId }),
        } as any,
      });

      // Copy current version stops if they exist
      if (original.currentVersion?.stops?.length) {
        const cv = original.currentVersion as any;
        const version = await tx.routeVersion.create({
          data: {
            routeId: newRoute.id,
            versionNumber: 1,
            validFrom: new Date(),
            geometry: cv.geometry || undefined,
            totalDistance: cv.totalDistance || undefined,
            totalDuration: cv.totalDuration || undefined,
            waypoints: cv.waypoints || {},
            stops: {
              create: original.currentVersion.stops.map((s: any) => ({
                stopId: s.stopId,
                sequenceNumber: s.sequenceNumber,
                distanceFromStart: s.distanceFromStart,
                durationFromStart: s.durationFromStart,
                isPickup: s.isPickup,
                isDropoff: s.isDropoff,
                isMain: s.isMain ?? false,
              })),
            },
          },
        });

        await tx.route.update({
          where: { id: newRoute.id },
          data: { currentVersionId: version.id },
        });
      }

      // Auto-add to company favorites
      if (userId) {
        try {
          await tx.companyFavoriteRoute.create({
            data: {
              companyId: newRoute.companyId,
              routeId: newRoute.id,
              addedById: userId,
            },
          });
        } catch {}
      }

      return this.findById(newRoute.id);
    });
  }

  async reverse(routeId: string, userId?: string) {
    const original = await this.findById(routeId);

    if (!original.currentVersion?.stops?.length) {
      throw new BadRequestException('Route has no stops to reverse');
    }

    const stops = original.currentVersion.stops;
    const reversedStopsForName = [...stops].reverse();
    const reversedName = this.generateRouteName(reversedStopsForName) || `${stops[stops.length - 1]?.stop?.name || 'A'} - ${stops[0]?.stop?.name || 'B'}`;

    const reversedStops = [...stops].reverse();

    // Compute ORS geometry for reversed route (no waypoints — they don't apply in reverse)
    const reversedCoords = reversedStops.map((s: any) => ({
      latitude: s.stop?.latitude ?? 0,
      longitude: s.stop?.longitude ?? 0,
    }));
    let orsResult: RoutePreviewResult | null = null;
    try {
      orsResult = await this.orsService.computeRouteGeometry(reversedCoords, {});
    } catch (error) {
      this.logger.warn('ORS geometry computation failed for reverse route', error);
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newRoute = await tx.route.create({
        data: {
          companyId: original.companyId,
          name: reversedName,
          nameOverridden: false,
          code: original.code ? `${original.code}-rev` : null,
          description: original.description,
          comment: (original as any).comment || null,
          type: original.type,
          ...(userId && { createdById: userId }),
        } as any,
      });

      const version = await tx.routeVersion.create({
        data: {
          routeId: newRoute.id,
          versionNumber: 1,
          validFrom: new Date(),
          ...(orsResult && {
            geometry: orsResult.geometry as any,
            totalDistance: orsResult.totalDistance,
            totalDuration: orsResult.totalDuration,
          }),
          waypoints: {},
          stops: {
            create: reversedStops.map((s: any, index: number) => {
              let distanceFromStart = 0;
              let durationFromStart = 0;
              if (orsResult && index > 0) {
                distanceFromStart = orsResult.segmentDistances.slice(0, index).reduce((a, b) => a + b, 0);
                durationFromStart = Math.round(orsResult.segmentDurations.slice(0, index).reduce((a, b) => a + b, 0) / 60);
              }
              return {
                stopId: s.stopId,
                sequenceNumber: index,
                distanceFromStart,
                durationFromStart,
                isPickup: s.isPickup,
                isDropoff: s.isDropoff,
                isMain: s.isMain ?? false,
              };
            }),
          },
        },
      });

      await tx.route.update({
        where: { id: newRoute.id },
        data: { currentVersionId: version.id },
      });

      // Auto-add to company favorites
      if (userId) {
        try {
          await tx.companyFavoriteRoute.create({
            data: {
              companyId: newRoute.companyId,
              routeId: newRoute.id,
              addedById: userId,
            },
          });
        } catch {}
      }

      return this.findById(newRoute.id);
    });
  }
}
