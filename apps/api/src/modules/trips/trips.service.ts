import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTripInput, UpdateTripInput, SearchTripsInput, TripStatus } from '@busap/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class TripsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: SearchTripsInput) {
    const {
      companyId,
      routeId,
      vehicleId,
      driverId,
      status,
      fromDate,
      toDate,
      limit = 20,
      offset = 0,
    } = params;

    return this.prisma.trip.findMany({
      where: {
        ...(companyId && { companyId }),
        ...(routeId && { routeId }),
        ...(vehicleId && { vehicleId }),
        ...(driverId && { driverId }),
        ...(status && { status }),
        ...(fromDate && { scheduledDepartureTime: { gte: fromDate } }),
        ...(toDate && { scheduledDepartureTime: { lte: toDate } }),
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
        driver: true,
      },
      orderBy: { scheduledDepartureTime: 'asc' },
      take: limit,
      skip: offset,
    });
  }

  async findById(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
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
        driver: true,
        stopTimes: {
          include: {
            routeStop: {
              include: { stop: true },
            },
          },
          orderBy: { scheduledArrival: 'asc' },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID ${id} not found`);
    }

    return trip;
  }

  async create(data: CreateTripInput) {
    // Get route with current version
    const route = await this.prisma.route.findUnique({
      where: { id: data.routeId },
      include: {
        currentVersion: {
          include: {
            stops: {
              orderBy: { sequenceNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!route || !route.currentVersion) {
      throw new BadRequestException('Route not found or has no active version');
    }

    // Calculate arrival time based on route duration
    const stops = route.currentVersion.stops;
    const lastStop = stops[stops.length - 1];
    const totalDuration = lastStop?.durationFromStart ?? 0;

    const scheduledArrivalTime = new Date(
      data.scheduledDepartureTime.getTime() + totalDuration * 60 * 1000,
    );

    // Create trip with stop times
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const trip = await tx.trip.create({
        data: {
          companyId: data.companyId,
          routeId: data.routeId,
          routeVersionId: route.currentVersion!.id,
          vehicleId: data.vehicleId,
          driverId: data.driverId,
          scheduledDepartureTime: data.scheduledDepartureTime,
          scheduledArrivalTime,
          status: TripStatus.SCHEDULED,
          notes: data.notes,
        },
      });

      // Create stop times
      const stopTimes = stops.map((stop: typeof stops[number]) => {
        const arrivalTime = new Date(
          data.scheduledDepartureTime.getTime() + stop.durationFromStart * 60 * 1000,
        );
        // Add 2 minutes dwell time at each stop
        const departureTime = new Date(arrivalTime.getTime() + 2 * 60 * 1000);

        return {
          tripId: trip.id,
          routeStopId: stop.id,
          scheduledArrival: arrivalTime,
          scheduledDeparture: departureTime,
        };
      });

      await tx.tripStopTime.createMany({
        data: stopTimes,
      });

      return this.findById(trip.id);
    });
  }

  async update(id: string, data: UpdateTripInput) {
    await this.findById(id);

    return this.prisma.trip.update({
      where: { id },
      data,
      include: {
        route: true,
        vehicle: true,
        driver: true,
      },
    });
  }

  async startTrip(id: string) {
    const trip = await this.findById(id);

    if (trip.status !== TripStatus.SCHEDULED) {
      throw new BadRequestException('Trip is not in scheduled status');
    }

    return this.prisma.trip.update({
      where: { id },
      data: {
        status: TripStatus.IN_PROGRESS,
        actualDepartureTime: new Date(),
      },
    });
  }

  async completeTrip(id: string) {
    const trip = await this.findById(id);

    if (trip.status !== TripStatus.IN_PROGRESS) {
      throw new BadRequestException('Trip is not in progress');
    }

    return this.prisma.trip.update({
      where: { id },
      data: {
        status: TripStatus.COMPLETED,
        actualArrivalTime: new Date(),
      },
    });
  }

  async cancelTrip(id: string) {
    const trip = await this.findById(id);

    if (trip.status === TripStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed trip');
    }

    return this.prisma.trip.update({
      where: { id },
      data: { status: TripStatus.CANCELLED },
    });
  }

  async getDriverTrips(driverId: string, date?: Date) {
    const targetDate = date ?? new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.trip.findMany({
      where: {
        driverId,
        scheduledDepartureTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
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
        stopTimes: {
          include: {
            routeStop: { include: { stop: true } },
          },
          orderBy: { scheduledArrival: 'asc' },
        },
      },
      orderBy: { scheduledDepartureTime: 'asc' },
    });
  }

  async searchUpcomingTrips(
    fromStopId: string,
    toStopId: string,
    date?: Date,
    companyId?: string,
  ) {
    const targetDate = date ?? new Date();

    // Find trips with matching route
    const trips = await this.prisma.trip.findMany({
      where: {
        status: TripStatus.SCHEDULED,
        scheduledDepartureTime: { gte: targetDate },
        ...(companyId && { companyId }),
      },
      include: {
        route: {
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
        },
        vehicle: true,
        stopTimes: {
          include: {
            routeStop: { include: { stop: true } },
          },
        },
      },
      orderBy: { scheduledDepartureTime: 'asc' },
      take: 50,
    });

    // Filter trips that go from fromStop to toStop
    return trips.filter((trip: typeof trips[number]) => {
      const stops = trip.route.currentVersion?.stops ?? [];
      const fromIndex = stops.findIndex((s: { stopId: string }) => s.stopId === fromStopId);
      const toIndex = stops.findIndex((s: { stopId: string }) => s.stopId === toStopId);
      return fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex;
    });
  }
}
