import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../config/redis.module';
import { VirtualTripService } from '../trips/virtual-trip.service';

export interface SimulationConfig {
  tripId: string;
  speedMultiplier: number; // 1.0 = realtime, 10.0 = 10x speed
  updateIntervalMs: number; // how often to report position
  randomDeviation: number; // meters of random deviation from route
}

export interface SimulationState {
  id: string;
  tripId: string;
  vehicleId: string;
  routeStops: Array<{
    stopId: string;
    name: string;
    latitude: number;
    longitude: number;
    sequenceNumber: number;
    distanceFromStart: number;
    durationFromStart: number;
  }>;
  config: SimulationConfig;
  currentSegment: number;
  segmentProgress: number; // 0.0 to 1.0
  startedAt: Date;
  status: 'running' | 'paused' | 'stopped' | 'completed';
  currentPosition: { latitude: number; longitude: number };
  speed: number; // km/h
  heading: number;
  totalDistance: number;
  elapsedMs: number;
}

@Injectable()
export class SimulatorService {
  private simulations: Map<string, SimulationState> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly logger = new Logger(SimulatorService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private redis: Redis,
    private virtualTripService: VirtualTripService,
  ) {}

  async startSimulation(config: SimulationConfig): Promise<SimulationState> {
    // Materialize if virtual trip ID
    const parsed = VirtualTripService.parseTripId(config.tripId);
    if (parsed.type === 'virtual') {
      const materialized = await this.virtualTripService.materializeTrip(
        parsed.scheduleId!,
        parsed.date!,
      );
      config.tripId = materialized.id;
    }

    // Load trip with route stops
    const trip = await this.prisma.trip.findUnique({
      where: { id: config.tripId },
      include: {
        route: true,
        vehicle: true,
        routeVersion: {
          include: {
            stops: {
              include: { stop: true },
              orderBy: { sequenceNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!trip) throw new NotFoundException('Trip not found');
    if (!trip.vehicleId) {
      throw new NotFoundException('Trip has no vehicle assigned — cannot simulate');
    }
    if (!trip.routeVersion?.stops.length) {
      throw new NotFoundException('Trip has no route stops defined');
    }

    const routeStops = trip.routeVersion.stops.map((rs) => ({
      stopId: rs.stopId,
      name: rs.stop.name,
      latitude: rs.stop.latitude,
      longitude: rs.stop.longitude,
      sequenceNumber: rs.sequenceNumber,
      distanceFromStart: rs.distanceFromStart,
      durationFromStart: rs.durationFromStart,
    }));

    const simId = `sim_${Date.now()}`;

    const state: SimulationState = {
      id: simId,
      tripId: config.tripId,
      vehicleId: trip.vehicleId!,
      routeStops,
      config,
      currentSegment: 0,
      segmentProgress: 0,
      startedAt: new Date(),
      status: 'running',
      currentPosition: {
        latitude: routeStops[0].latitude,
        longitude: routeStops[0].longitude,
      },
      speed: 0,
      heading: 0,
      totalDistance: routeStops[routeStops.length - 1].distanceFromStart,
      elapsedMs: 0,
    };

    this.simulations.set(simId, state);

    // Start the simulation loop
    const interval = setInterval(() => {
      this.tick(simId);
    }, config.updateIntervalMs);

    this.intervals.set(simId, interval);

    // Mark trip as in_progress
    await this.prisma.trip.update({
      where: { id: config.tripId },
      data: {
        status: 'in_progress',
        actualDepartureTime: new Date(),
      },
    });

    this.logger.log(`Simulation ${simId} started for trip ${config.tripId}`);
    return state;
  }

  private async tick(simId: string) {
    const state = this.simulations.get(simId);
    if (!state || state.status !== 'running') return;

    const { routeStops, config } = state;
    const tickMs = config.updateIntervalMs * config.speedMultiplier;

    state.elapsedMs += tickMs;

    // Calculate total trip duration in ms
    const totalDurationMs =
      routeStops[routeStops.length - 1].durationFromStart * 60 * 1000;

    if (state.elapsedMs >= totalDurationMs) {
      // Trip completed
      state.status = 'completed';
      state.currentPosition = {
        latitude: routeStops[routeStops.length - 1].latitude,
        longitude: routeStops[routeStops.length - 1].longitude,
      };
      state.speed = 0;

      await this.publishPosition(state);

      // Mark trip as completed
      await this.prisma.trip.update({
        where: { id: state.tripId },
        data: {
          status: 'completed',
          actualArrivalTime: new Date(),
        },
      });

      this.stopSimulation(simId);
      this.logger.log(`Simulation ${simId} completed`);
      return;
    }

    // Find current segment based on elapsed time
    const elapsedMinutes = state.elapsedMs / (60 * 1000);

    let segmentIdx = 0;
    for (let i = 1; i < routeStops.length; i++) {
      if (routeStops[i].durationFromStart > elapsedMinutes) {
        segmentIdx = i - 1;
        break;
      }
      segmentIdx = i - 1;
    }

    state.currentSegment = segmentIdx;

    // Calculate progress within current segment
    const segStart = routeStops[segmentIdx];
    const segEnd = routeStops[segmentIdx + 1] || routeStops[segmentIdx];
    const segDuration = segEnd.durationFromStart - segStart.durationFromStart;

    if (segDuration > 0) {
      state.segmentProgress =
        (elapsedMinutes - segStart.durationFromStart) / segDuration;
    } else {
      state.segmentProgress = 1;
    }

    state.segmentProgress = Math.min(1, Math.max(0, state.segmentProgress));

    // Interpolate position
    const lat =
      segStart.latitude +
      (segEnd.latitude - segStart.latitude) * state.segmentProgress;
    const lng =
      segStart.longitude +
      (segEnd.longitude - segStart.longitude) * state.segmentProgress;

    // Add random deviation
    const deviationLat =
      ((Math.random() - 0.5) * config.randomDeviation) / 111000;
    const deviationLng =
      ((Math.random() - 0.5) * config.randomDeviation) /
      (111000 * Math.cos((lat * Math.PI) / 180));

    state.currentPosition = {
      latitude: lat + deviationLat,
      longitude: lng + deviationLng,
    };

    // Calculate heading
    state.heading = this.calculateBearing(
      segStart.latitude,
      segStart.longitude,
      segEnd.latitude,
      segEnd.longitude,
    );

    // Calculate speed
    const segDistance = segEnd.distanceFromStart - segStart.distanceFromStart;
    if (segDuration > 0) {
      state.speed = (segDistance / 1000) / (segDuration / 60); // km/h
    }

    // Publish position to GPS system
    await this.publishPosition(state);
  }

  private async publishPosition(state: SimulationState) {
    const positionData = {
      vehicleId: state.vehicleId,
      tripId: state.tripId,
      latitude: state.currentPosition.latitude,
      longitude: state.currentPosition.longitude,
      speed: state.speed,
      heading: state.heading,
      accuracy: 5 + Math.random() * 10,
      timestamp: new Date().toISOString(),
      simulated: true,
    };

    // Save position to database
    await this.prisma.vehiclePosition.create({
      data: {
        vehicleId: state.vehicleId,
        tripId: state.tripId,
        latitude: state.currentPosition.latitude,
        longitude: state.currentPosition.longitude,
        speed: state.speed,
        heading: state.heading,
        accuracy: positionData.accuracy,
      },
    });

    // Cache in Redis
    await this.redis.setex(
      `vehicle:position:${state.vehicleId}`,
      60,
      JSON.stringify(positionData),
    );

    // Publish to realtime channel
    await this.redis.publish('bus:positions', JSON.stringify(positionData));
  }

  pauseSimulation(simId: string): SimulationState | null {
    const state = this.simulations.get(simId);
    if (!state) return null;
    state.status = 'paused';
    return state;
  }

  resumeSimulation(simId: string): SimulationState | null {
    const state = this.simulations.get(simId);
    if (!state) return null;
    state.status = 'running';
    return state;
  }

  stopSimulation(simId: string): SimulationState | null {
    const state = this.simulations.get(simId);
    if (!state) return null;

    state.status = 'stopped';

    const interval = this.intervals.get(simId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(simId);
    }

    return state;
  }

  getSimulation(simId: string): SimulationState | null {
    return this.simulations.get(simId) || null;
  }

  listSimulations(): SimulationState[] {
    return Array.from(this.simulations.values());
  }

  async getAvailableTrips() {
    return this.prisma.trip.findMany({
      where: {
        status: { in: ['scheduled', 'in_progress'] },
      },
      include: {
        route: { select: { name: true, code: true } },
        vehicle: { select: { registrationNumber: true, brand: true, model: true } },
        driver: { select: { firstName: true, lastName: true } },
        routeVersion: {
          include: {
            stops: {
              include: { stop: { select: { name: true, latitude: true, longitude: true } } },
              orderBy: { sequenceNumber: 'asc' },
            },
          },
        },
      },
      orderBy: { scheduledDepartureTime: 'asc' },
      take: 20,
    });
  }

  private calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x =
      Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
      Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }
}
