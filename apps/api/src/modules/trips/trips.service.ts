import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VirtualTripService } from './virtual-trip.service';
import { CreateTripInput, UpdateTripInput, SearchTripsInput, TripStatus } from '@busap/shared';
import { Prisma } from '@prisma/client';
import { expandRRule, getSingleDate } from '../schedules/utils/rrule.util';
import { parseTimeToDate } from '../schedules/utils/trip-generator.util';
import { formatDate } from '../calendars/utils/easter.util';

@Injectable()
export class TripsService {
  constructor(
    private prisma: PrismaService,
    private virtualTripService: VirtualTripService,
  ) {}

  async findAll(params: SearchTripsInput) {
    const {
      companyId,
      routeId,
      vehicleId,
      driverId,
      status,
      fromDate,
      toDate,
      limit,
      offset,
    } = params;

    const take = limit != null && !isNaN(Number(limit)) ? Number(limit) : 20;
    const skip = offset != null && !isNaN(Number(offset)) ? Number(offset) : 0;

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
      take,
      skip,
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
          vehicleId: data.vehicleId || null,
          driverId: data.driverId || null,
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
    const fromDate = date ?? new Date();
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + 7); // search next 7 days

    // 1. Find active route versions that contain fromStop, then post-filter for toStop order
    const routeVersions = await this.prisma.routeVersion.findMany({
      where: {
        isActive: true,
        stops: { some: { stopId: fromStopId } },
      },
      include: {
        stops: { orderBy: { sequenceNumber: 'asc' } },
      },
    });

    const validRouteVersionIds = routeVersions
      .filter((rv) => {
        const fromIdx = rv.stops.findIndex((s) => s.stopId === fromStopId);
        const toIdx = rv.stops.findIndex((s) => s.stopId === toStopId);
        return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
      })
      .map((rv) => rv.id);

    if (validRouteVersionIds.length === 0) return [];

    // 2. Fetch active trip_schedules for matching routes
    const schedules = await this.prisma.tripSchedule.findMany({
      where: {
        isActive: true,
        ...(companyId && { companyId }),
        route: { currentVersionId: { in: validRouteVersionIds } },
      },
      include: {
        route: {
          include: {
            company: true,
            currentVersion: {
              include: {
                stops: { include: { stop: true }, orderBy: { sequenceNumber: 'asc' } },
              },
            },
          },
        },
        vehicle: true,
        driver: true,
        exceptions: true,
      },
    });

    // 3. Fetch materialized trips for the date range on matching routes
    const materializedTrips = await this.prisma.trip.findMany({
      where: {
        scheduledDepartureTime: { gte: fromDate, lte: toDate },
        ...(companyId && { companyId }),
        route: { currentVersionId: { in: validRouteVersionIds } },
      },
      include: {
        route: { include: { company: true } },
        vehicle: true,
        driver: true,
      },
      orderBy: { scheduledDepartureTime: 'asc' },
      take: 50,
    });

    const materializedKeys = new Set(
      materializedTrips
        .filter((t) => t.scheduleId && t.scheduleDate)
        .map((t) => `${t.scheduleId}:${formatDate(t.scheduleDate!)}`),
    );

    // 4. Expand schedules into virtual trips
    const results: any[] = [];

    for (const schedule of schedules) {
      const scheduleStart =
        schedule.validFrom && schedule.validFrom > fromDate ? schedule.validFrom : fromDate;
      const scheduleEnd =
        schedule.validTo && schedule.validTo < toDate ? schedule.validTo : toDate;

      let dates: Date[];
      if (schedule.scheduleType === 'single') {
        dates = getSingleDate(schedule.validFrom).filter(
          (d) => d >= fromDate && d <= toDate,
        );
      } else if (schedule.rrule) {
        dates = expandRRule(schedule.rrule, scheduleStart, scheduleEnd);
      } else {
        dates = [];
      }

      const exceptionMap = new Map(
        schedule.exceptions.map((ex: any) => [formatDate(ex.date), ex]),
      );

      for (const d of dates) {
        const dateStr = formatDate(d);
        const exception = exceptionMap.get(dateStr);
        if (exception?.type === 'skip') continue;
        if (materializedKeys.has(`${schedule.id}:${dateStr}`)) continue;

        const deptTime = exception?.newDepartureTime || schedule.departureTime;
        const arrTime = exception?.newArrivalTime || schedule.arrivalTime;
        const tripDate = new Date(dateStr);
        const deptDatetime = parseTimeToDate(tripDate, deptTime);
        const arrDatetime = parseTimeToDate(tripDate, arrTime);
        if (arrDatetime < deptDatetime) arrDatetime.setDate(arrDatetime.getDate() + 1);
        if (deptDatetime < fromDate || deptDatetime > toDate) continue;

        results.push({
          id: `virtual:${schedule.id}:${dateStr}`,
          scheduledDepartureTime: deptDatetime.toISOString(),
          scheduledArrivalTime: arrDatetime.toISOString(),
          status: TripStatus.SCHEDULED,
          route: {
            id: schedule.route.id,
            name: schedule.route.name,
            code: (schedule.route as any).code ?? null,
          },
          company: {
            id: schedule.route.company.id,
            name: schedule.route.company.name,
            logoUrl: (schedule.route.company as any).logoUrl ?? null,
          },
          vehicle: schedule.vehicle,
          driver: schedule.driver,
          duration: Math.round(
            (arrDatetime.getTime() - deptDatetime.getTime()) / 60000,
          ),
          routeVersion: schedule.route.currentVersion
            ? {
                stops: schedule.route.currentVersion.stops.map((s: any) => ({
                  stop: s.stop,
                  sequenceNumber: s.sequenceNumber,
                  departureOffset: 0,
                })),
              }
            : undefined,
        });
      }
    }

    // 5. Add materialized trips
    for (const trip of materializedTrips) {
      results.push({
        id: trip.id,
        scheduledDepartureTime: trip.scheduledDepartureTime.toISOString(),
        scheduledArrivalTime: trip.scheduledArrivalTime?.toISOString() ?? null,
        status: trip.status,
        route: {
          id: trip.route.id,
          name: trip.route.name,
          code: (trip.route as any).code ?? null,
        },
        company: {
          id: trip.route.company.id,
          name: trip.route.company.name,
          logoUrl: (trip.route.company as any).logoUrl ?? null,
        },
        vehicle: trip.vehicle,
        driver: trip.driver,
        duration:
          trip.scheduledArrivalTime
            ? Math.round(
                (trip.scheduledArrivalTime.getTime() -
                  trip.scheduledDepartureTime.getTime()) /
                  60000,
              )
            : undefined,
      });
    }

    results.sort(
      (a, b) =>
        new Date(a.scheduledDepartureTime).getTime() -
        new Date(b.scheduledDepartureTime).getTime(),
    );

    return results.slice(0, 50);
  }

  /**
   * Get all company trips for a driver with assignment flag
   */
  async getDriverCompanyTrips(driverId: string, date?: Date) {
    // First, get the driver's company memberships
    const driverMemberships = await this.prisma.companyUser.findMany({
      where: {
        userId: driverId,
        role: 'driver',
        isActive: true,
      },
      select: { companyId: true },
    });

    if (driverMemberships.length === 0) {
      return { trips: [], nextTrip: null };
    }

    const companyIds = driverMemberships.map((m) => m.companyId);
    const targetDate = date ?? new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all company trips for today
    const trips = await this.prisma.trip.findMany({
      where: {
        companyId: { in: companyIds },
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
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { scheduledDepartureTime: 'asc' },
    });

    // Add isAssignedToMe flag to each trip
    const tripsWithAssignment = trips.map((trip) => ({
      ...trip,
      isAssignedToMe: trip.driverId === driverId,
    }));

    return tripsWithAssignment;
  }

  /**
   * Get driver schedule (virtual + materialized trips) for a date range
   */
  async getDriverSchedule(driverId: string, fromDate: Date, toDate: Date) {
    // Get driver's company memberships
    const memberships = await this.prisma.companyUser.findMany({
      where: {
        userId: driverId,
        role: 'driver',
        isActive: true,
      },
      select: { companyId: true },
    });

    if (memberships.length === 0) {
      return [];
    }

    // Get virtual trips for each company
    const allTrips = await Promise.all(
      memberships.map((m) =>
        this.virtualTripService.getTripsForDateRange(m.companyId, fromDate, toDate, {
          driverId,
        }),
      ),
    );

    // Merge and sort by departure time
    return allTrips
      .flat()
      .sort(
        (a, b) =>
          new Date(a.scheduledDepartureTime).getTime() -
          new Date(b.scheduledDepartureTime).getTime(),
      );
  }

  /**
   * Get driver's next upcoming trip with time until departure
   */
  async getDriverNextTrip(driverId: string) {
    const now = new Date();

    // Find the next scheduled trip for this driver
    const nextTrip = await this.prisma.trip.findFirst({
      where: {
        driverId,
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
        stopTimes: {
          include: {
            routeStop: { include: { stop: true } },
          },
          orderBy: { scheduledArrival: 'asc' },
        },
      },
      orderBy: { scheduledDepartureTime: 'asc' },
    });

    if (!nextTrip) {
      return {
        trip: null,
        timeUntilDeparture: null,
        timeUntilDepartureMs: null,
      };
    }

    const timeUntilDepartureMs =
      nextTrip.scheduledDepartureTime.getTime() - now.getTime();

    // Format time remaining
    const hours = Math.floor(timeUntilDepartureMs / (1000 * 60 * 60));
    const minutes = Math.floor(
      (timeUntilDepartureMs % (1000 * 60 * 60)) / (1000 * 60),
    );

    let timeUntilDeparture: string;
    if (hours > 0) {
      timeUntilDeparture = `${hours}h ${minutes}m`;
    } else {
      timeUntilDeparture = `${minutes}m`;
    }

    return {
      trip: nextTrip,
      timeUntilDeparture,
      timeUntilDepartureMs,
    };
  }
}
