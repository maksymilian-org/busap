import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStopInput, UpdateStopInput, SearchStopsInput, TripStatus } from '@busap/shared';
import { Prisma } from '@prisma/client';
import { GeocodingService } from '../geocoding/geocoding.service';

@Injectable()
export class StopsService {
  constructor(
    private prisma: PrismaService,
    private geocodingService: GeocodingService,
  ) {}

  async findAll(companyId?: string, favoritesOnly = true) {
    const createdBySelect = {
      select: { id: true, firstName: true, lastName: true },
    };

    if (favoritesOnly && companyId) {
      // Return only favorite stops for this company
      const favorites = await this.prisma.companyFavoriteStop.findMany({
        where: { companyId },
        include: {
          stop: {
            include: { createdBy: createdBySelect },
          },
        },
      });
      return favorites
        .map((f) => ({ ...f.stop, isFavorite: true }))
        .filter((s) => s.isActive)
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    const stops = await this.prisma.stop.findMany({
      where: {
        isActive: true,
        ...(companyId && {
          OR: [{ companyId: null }, { companyId }],
        }),
      },
      include: { createdBy: createdBySelect },
      orderBy: { name: 'asc' },
    });

    if (companyId) {
      const favoriteStopIds = new Set(
        (
          await this.prisma.companyFavoriteStop.findMany({
            where: { companyId },
            select: { stopId: true },
          })
        ).map((f) => f.stopId),
      );
      return stops.map((stop) => ({ ...stop, isFavorite: favoriteStopIds.has(stop.id) }));
    }

    return stops;
  }

  async findById(id: string) {
    const stop = await this.prisma.stop.findUnique({
      where: { id },
    });

    if (!stop) {
      throw new NotFoundException(`Stop with ID ${id} not found`);
    }

    return stop;
  }

  async search(params: SearchStopsInput) {
    const { query, companyId, latitude, longitude, radius, limit = 20, offset = 0 } = params;

    // Use raw query with unaccent for diacritics-insensitive search
    if (query) {
      const q = `%${query}%`;
      const companyFilter = companyId
        ? Prisma.sql`AND (company_id IS NULL OR company_id = ${companyId})`
        : Prisma.empty;

      const results = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, code, city, latitude, longitude, is_active AS "isActive",
               country, address, postal_code AS "postalCode", company_id AS "companyId"
        FROM stops
        WHERE is_active = true
          AND (unaccent(name) ILIKE unaccent(${q})
            OR unaccent(city) ILIKE unaccent(${q})
            OR code ILIKE ${q})
          ${companyFilter}
        ORDER BY name
        LIMIT ${limit} OFFSET ${offset}
      `;

      if (latitude !== undefined && longitude !== undefined) {
        const stopsWithDistance = results.map((stop: any) => ({
          ...stop,
          distance: this.calculateDistance(latitude, longitude, stop.latitude, stop.longitude),
        }));
        const filtered = radius
          ? stopsWithDistance.filter((s: { distance: number }) => s.distance <= radius)
          : stopsWithDistance;
        return filtered.sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance);
      }

      return results;
    }

    const where: any = { isActive: true };

    if (companyId) {
      where.AND = [
        {
          OR: [{ companyId: null }, { companyId }],
        },
      ];
    }

    const stops = await this.prisma.stop.findMany({
      where,
      take: limit,
      skip: offset || 0,
      orderBy: { name: 'asc' },
    });

    // If coordinates provided, calculate distances and sort
    if (latitude !== undefined && longitude !== undefined) {
      const stopsWithDistance = stops.map((stop: typeof stops[number]) => ({
        ...stop,
        distance: this.calculateDistance(
          latitude,
          longitude,
          stop.latitude,
          stop.longitude,
        ),
      }));

      // Filter by radius if provided
      const filtered = radius
        ? stopsWithDistance.filter((s: { distance: number }) => s.distance <= radius)
        : stopsWithDistance;

      // Sort by distance
      return filtered.sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance);
    }

    return stops;
  }

  async create(data: CreateStopInput, userId?: string) {
    // Auto-geocode if coordinates provided and no formattedAddress
    if (data.latitude && data.longitude && !data.formattedAddress) {
      const geo = await this.geocodingService.reverseGeocode(data.latitude, data.longitude);
      if (geo) {
        // User-provided values take precedence
        data = {
          ...data,
          city: data.city || geo.city,
          country: data.country || geo.country,
          county: data.county || geo.county,
          region: data.region || geo.region,
          postalCode: data.postalCode || geo.postalCode,
          countryCode: data.countryCode || geo.countryCode,
          address: data.address || geo.address,
          formattedAddress: geo.formattedAddress,
        };
      }
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const stop = await tx.stop.create({
        data: {
          ...data,
          ...(userId && { createdById: userId }),
        },
      });

      // Auto-add to company favorites if the user belongs to a company
      if (userId) {
        const companyUser = await tx.companyUser.findFirst({
          where: { userId, isActive: true },
        });

        if (companyUser) {
          await tx.companyFavoriteStop.create({
            data: {
              companyId: companyUser.companyId,
              stopId: stop.id,
              addedById: userId,
            },
          });
        }
      }

      return stop;
    });
  }

  async update(id: string, data: UpdateStopInput) {
    const existing = await this.findById(id);

    // Re-geocode if coordinates changed and no explicit formattedAddress provided
    const latChanged = data.latitude !== undefined && data.latitude !== existing.latitude;
    const lngChanged = data.longitude !== undefined && data.longitude !== existing.longitude;
    if ((latChanged || lngChanged) && !data.formattedAddress) {
      const newLat = data.latitude ?? existing.latitude;
      const newLng = data.longitude ?? existing.longitude;
      const geo = await this.geocodingService.reverseGeocode(newLat, newLng);
      if (geo) {
        data = {
          ...data,
          city: data.city || geo.city,
          country: data.country || geo.country,
          county: data.county || geo.county,
          region: data.region || geo.region,
          postalCode: data.postalCode || geo.postalCode,
          countryCode: data.countryCode || geo.countryCode,
          address: data.address || geo.address,
          formattedAddress: geo.formattedAddress,
        };
      }
    }

    return this.prisma.stop.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.stop.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async addFavorite(companyId: string, stopId: string, userId: string) {
    await this.findById(stopId);

    try {
      return await this.prisma.companyFavoriteStop.create({
        data: {
          companyId,
          stopId,
          addedById: userId,
        },
        include: { stop: true },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Stop is already a favorite for this company');
      }
      throw error;
    }
  }

  async removeFavorite(companyId: string, stopId: string) {
    const favorite = await this.prisma.companyFavoriteStop.findUnique({
      where: {
        companyId_stopId: { companyId, stopId },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    return this.prisma.companyFavoriteStop.delete({
      where: { id: favorite.id },
    });
  }

  async getUpcomingTrips(stopId: string) {
    await this.findById(stopId);

    const now = new Date();

    const trips = await this.prisma.trip.findMany({
      where: {
        status: TripStatus.SCHEDULED,
        scheduledDepartureTime: { gte: now },
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
      },
      orderBy: { scheduledDepartureTime: 'asc' },
      take: 100,
    });

    const result = trips.filter((trip: typeof trips[number]) => {
      const stops = trip.route.currentVersion?.stops ?? [];
      return stops.some((s: { stopId: string }) => s.stopId === stopId);
    });

    return result.slice(0, 20).map((trip: typeof trips[number]) => {
      const stops = trip.route.currentVersion?.stops ?? [];
      const firstStop = stops[0]?.stop?.name ?? '-';
      const lastStop = stops[stops.length - 1]?.stop?.name ?? '-';
      return {
        id: trip.id,
        routeName: trip.route.name,
        routeCode: (trip.route as any).code,
        direction: `${firstStop} → ${lastStop}`,
        scheduledDepartureTime: trip.scheduledDepartureTime,
        vehicleRegistration: trip.vehicle?.registrationNumber ?? null,
      };
    });
  }

  async getFavorites(companyId: string) {
    return this.prisma.companyFavoriteStop.findMany({
      where: { companyId },
      include: { stop: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByBBox(
    minLat: number,
    maxLat: number,
    minLng: number,
    maxLng: number,
    companyId?: string,
    limit = 100,
  ) {
    return this.prisma.stop.findMany({
      where: {
        isActive: true,
        latitude: { gte: minLat, lte: maxLat },
        longitude: { gte: minLng, lte: maxLng },
        ...(companyId && {
          OR: [{ companyId: null }, { companyId }],
        }),
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  async getNearbyStops(latitude: number, longitude: number, radiusMeters = 5000) {
    const stops = await this.prisma.stop.findMany({
      where: { isActive: true },
    });

    return stops
      .map((stop: typeof stops[number]) => ({
        ...stop,
        distance: this.calculateDistance(
          latitude,
          longitude,
          stop.latitude,
          stop.longitude,
        ),
      }))
      .filter((stop: { distance: number }) => stop.distance <= radiusMeters)
      .sort((a: { distance: number }, b: { distance: number }) => a.distance - b.distance);
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
