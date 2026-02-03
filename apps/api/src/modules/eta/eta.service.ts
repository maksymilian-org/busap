import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../config/redis.module';
import { ETA, ETASource, ETAResponse, ETABatchResponse } from '@busap/shared';

@Injectable()
export class EtaService {
  private readonly CACHE_TTL = 30; // seconds

  constructor(
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async getETA(tripId: string, stopId: string): Promise<ETAResponse> {
    // Check cache first
    const cacheKey = `eta:${tripId}:${stopId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Calculate ETA
    const eta = await this.calculateETA(tripId, stopId);

    // Get vehicle position
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        vehicle: {
          include: {
            positions: {
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const lastPosition = trip?.vehicle?.positions[0];

    const response: ETAResponse = {
      eta,
      ...(lastPosition && {
        vehicle: {
          latitude: lastPosition.latitude,
          longitude: lastPosition.longitude,
          speed: lastPosition.speed ?? undefined,
          lastUpdate: lastPosition.timestamp,
        },
      }),
    };

    // Cache result
    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(response));

    return response;
  }

  async getBatchETA(tripId: string, stopIds: string[]): Promise<ETABatchResponse> {
    const etas: ETA[] = [];

    for (const stopId of stopIds) {
      const eta = await this.calculateETA(tripId, stopId);
      etas.push(eta);
    }

    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        vehicle: {
          include: {
            positions: {
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const lastPosition = trip?.vehicle?.positions[0];

    return {
      tripId,
      etas,
      ...(lastPosition && {
        vehicle: {
          latitude: lastPosition.latitude,
          longitude: lastPosition.longitude,
          speed: lastPosition.speed ?? undefined,
          lastUpdate: lastPosition.timestamp,
        },
      }),
    };
  }

  private async calculateETA(tripId: string, stopId: string): Promise<ETA> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        stopTimes: {
          include: {
            routeStop: { include: { stop: true } },
          },
        },
        vehicle: {
          include: {
            positions: {
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
          },
        },
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

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found`);
    }

    const stopTime = trip.stopTimes.find(
      (st: { routeStop: { stopId: string } }) => st.routeStop.stopId === stopId,
    );

    if (!stopTime) {
      throw new NotFoundException(`Stop ${stopId} not found in trip ${tripId}`);
    }

    const scheduledArrival = stopTime.scheduledArrival;
    let estimatedArrival = scheduledArrival;
    let source: typeof ETASource[keyof typeof ETASource] = ETASource.SCHEDULE;
    let confidence = 0.5;

    // Try GPS-based ETA
    const lastPosition = trip.vehicle?.positions[0];
    if (lastPosition && trip.status === 'in_progress') {
      const gpsEta = await this.calculateGPSBasedETA(
        trip,
        stopId,
        lastPosition,
      );
      if (gpsEta) {
        estimatedArrival = gpsEta;
        source = ETASource.GPS;
        confidence = 0.9;
      }
    }

    // Try historical correction
    const historicalCorrection = await this.getHistoricalCorrection(
      trip.routeId,
      stopId,
    );
    if (historicalCorrection && source === ETASource.SCHEDULE) {
      estimatedArrival = new Date(
        scheduledArrival.getTime() + historicalCorrection * 60 * 1000,
      );
      source = ETASource.HISTORICAL;
      confidence = 0.7;
    }

    const delayMinutes = Math.round(
      (estimatedArrival.getTime() - scheduledArrival.getTime()) / 60000,
    );

    return {
      tripId,
      stopId,
      scheduledArrival,
      estimatedArrival,
      source,
      confidence,
      delayMinutes,
      updatedAt: new Date(),
    };
  }

  private async calculateGPSBasedETA(
    trip: any,
    stopId: string,
    lastPosition: any,
  ): Promise<Date | null> {
    const stops = trip.route?.currentVersion?.stops ?? [];
    const targetStop = stops.find((s: any) => s.stopId === stopId);

    if (!targetStop) return null;

    // Calculate remaining distance
    const currentLat = lastPosition.latitude;
    const currentLon = lastPosition.longitude;
    const targetLat = targetStop.stop.latitude;
    const targetLon = targetStop.stop.longitude;

    const distance = this.calculateDistance(
      currentLat,
      currentLon,
      targetLat,
      targetLon,
    );

    // Estimate speed (use reported speed or default 40 km/h)
    const speedKmh = lastPosition.speed ?? 40;
    const speedMs = (speedKmh * 1000) / 3600;

    // Calculate ETA
    const etaSeconds = distance / speedMs;
    const etaMs = etaSeconds * 1000;

    return new Date(Date.now() + etaMs);
  }

  private async getHistoricalCorrection(
    routeId: string,
    stopId: string,
  ): Promise<number | null> {
    // Get average delay from completed trips in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedTrips = await this.prisma.tripStopTime.findMany({
      where: {
        trip: {
          routeId,
          status: 'completed',
          actualArrivalTime: { gte: thirtyDaysAgo },
        },
        routeStop: { stopId },
        actualArrival: { not: null },
      },
      select: {
        scheduledArrival: true,
        actualArrival: true,
      },
    });

    if (completedTrips.length < 5) return null;

    const delays = completedTrips.map((t: { scheduledArrival: Date; actualArrival: Date | null }) => {
      const scheduled = t.scheduledArrival.getTime();
      const actual = t.actualArrival!.getTime();
      return (actual - scheduled) / 60000; // minutes
    });

    // Return average delay
    return delays.reduce((a: number, b: number) => a + b, 0) / delays.length;
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

  async invalidateCache(tripId: string) {
    const keys = await this.redis.keys(`eta:${tripId}:*`);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
