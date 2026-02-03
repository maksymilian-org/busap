import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStopInput, UpdateStopInput, SearchStopsInput } from '@busap/shared';

@Injectable()
export class StopsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId?: string) {
    return this.prisma.stop.findMany({
      where: {
        isActive: true,
        OR: companyId
          ? [{ companyId: null }, { companyId }]
          : [{ companyId: null }],
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
      skip: offset,
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

  async create(data: CreateStopInput) {
    return this.prisma.stop.create({
      data,
    });
  }

  async update(id: string, data: UpdateStopInput) {
    await this.findById(id);

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
