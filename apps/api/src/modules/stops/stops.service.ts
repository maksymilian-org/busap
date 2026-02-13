import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStopInput, UpdateStopInput, SearchStopsInput } from '@busap/shared';
import { Prisma } from '@prisma/client';
import { GeocodingService } from '../geocoding/geocoding.service';

@Injectable()
export class StopsService {
  constructor(
    private prisma: PrismaService,
    private geocodingService: GeocodingService,
  ) {}

  async findAll(companyId?: string, favoritesOnly = true) {
    if (favoritesOnly && companyId) {
      // Return only favorite stops for this company
      const favorites = await this.prisma.companyFavoriteStop.findMany({
        where: { companyId },
        include: {
          stop: true,
        },
      });
      return favorites
        .map((f) => f.stop)
        .filter((s) => s.isActive)
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return this.prisma.stop.findMany({
      where: {
        isActive: true,
        ...(companyId && {
          OR: [{ companyId: null }, { companyId }],
        }),
      },
      orderBy: { name: 'asc' },
    });
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

    const where: any = { isActive: true };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } },
      ];
    }

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

  async getFavorites(companyId: string) {
    return this.prisma.companyFavoriteStop.findMany({
      where: { companyId },
      include: { stop: true },
      orderBy: { createdAt: 'desc' },
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
