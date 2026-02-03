import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../config/redis.module';
import { EtaService } from '../eta/eta.service';
import { ReportPositionInput, LiveBusPosition } from '@busap/shared';

@Injectable()
export class GpsService {
  private readonly POSITION_CACHE_TTL = 60; // seconds
  private readonly POSITION_CHANNEL = 'bus:positions';

  constructor(
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private redis: Redis,
    private etaService: EtaService,
  ) {}

  async reportPosition(data: ReportPositionInput) {
    // Save to database
    const position = await this.prisma.vehiclePosition.create({
      data: {
        vehicleId: data.vehicleId,
        tripId: data.tripId,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        heading: data.heading,
        accuracy: data.accuracy,
      },
    });

    // Cache latest position in Redis
    const cacheKey = `vehicle:position:${data.vehicleId}`;
    await this.redis.setex(
      cacheKey,
      this.POSITION_CACHE_TTL,
      JSON.stringify(position),
    );

    // If trip is active, update ETA cache and publish to realtime
    if (data.tripId) {
      await this.etaService.invalidateCache(data.tripId);

      // Get trip details for realtime update
      const trip = await this.prisma.trip.findUnique({
        where: { id: data.tripId },
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
        },
      });

      if (trip) {
        // Determine next stop
        const nextStop = await this.determineNextStop(
          trip,
          data.latitude,
          data.longitude,
        );

        const livePosition: LiveBusPosition = {
          tripId: data.tripId,
          vehicleId: data.vehicleId,
          routeId: trip.routeId,
          latitude: data.latitude,
          longitude: data.longitude,
          speed: data.speed,
          heading: data.heading,
          nextStopId: nextStop?.stopId,
          nextStopETA: nextStop?.eta,
          status: trip.status,
          updatedAt: new Date(),
        };

        // Publish to Redis pub/sub for realtime updates
        await this.redis.publish(
          this.POSITION_CHANNEL,
          JSON.stringify(livePosition),
        );

        // Cache live position by trip
        await this.redis.setex(
          `trip:position:${data.tripId}`,
          this.POSITION_CACHE_TTL,
          JSON.stringify(livePosition),
        );
      }
    }

    return position;
  }

  async getLatestPosition(vehicleId: string) {
    // Try cache first
    const cacheKey = `vehicle:position:${vehicleId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Fallback to database
    return this.prisma.vehiclePosition.findFirst({
      where: { vehicleId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getLivePosition(tripId: string): Promise<LiveBusPosition | null> {
    const cached = await this.redis.get(`trip:position:${tripId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async getLivePositionsForRoute(routeId: string): Promise<LiveBusPosition[]> {
    // Get all active trips for route
    const trips = await this.prisma.trip.findMany({
      where: {
        routeId,
        status: 'in_progress',
      },
      select: { id: true },
    });

    const positions: LiveBusPosition[] = [];

    for (const trip of trips) {
      const position = await this.getLivePosition(trip.id);
      if (position) {
        positions.push(position);
      }
    }

    return positions;
  }

  async getPositionHistory(
    vehicleId: string,
    fromDate: Date,
    toDate: Date,
  ) {
    return this.prisma.vehiclePosition.findMany({
      where: {
        vehicleId,
        timestamp: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  private async determineNextStop(
    trip: any,
    currentLat: number,
    currentLon: number,
  ): Promise<{ stopId: string; eta: Date } | null> {
    const stops = trip.route?.currentVersion?.stops ?? [];

    if (stops.length === 0) return null;

    // Find the closest upcoming stop
    let minDistance = Infinity;
    let nextStop = null;

    for (const routeStop of stops) {
      const distance = this.calculateDistance(
        currentLat,
        currentLon,
        routeStop.stop.latitude,
        routeStop.stop.longitude,
      );

      // Consider a stop as "passed" if within 100m
      if (distance < minDistance && distance > 100) {
        minDistance = distance;
        nextStop = routeStop;
      }
    }

    if (!nextStop) return null;

    // Calculate simple ETA based on distance and average speed
    const avgSpeedMs = 40 * 1000 / 3600; // 40 km/h in m/s
    const etaSeconds = minDistance / avgSpeedMs;

    return {
      stopId: nextStop.stopId,
      eta: new Date(Date.now() + etaSeconds * 1000),
    };
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3;
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
