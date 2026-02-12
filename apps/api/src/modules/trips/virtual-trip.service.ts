import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarsService } from '../calendars/calendars.service';
import {
  expandRRule,
  getSingleDate,
  filterDatesByModifiers,
  CalendarModifier,
} from '../schedules/utils/rrule.util';
import { parseTimeToDate } from '../schedules/utils/trip-generator.util';
import { formatDate } from '../calendars/utils/easter.util';
import { TripStatus, TripStatusType, VirtualTrip, VirtualStopTime, ParsedTripId } from '@busap/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class VirtualTripService {
  constructor(
    private prisma: PrismaService,
    private calendarsService: CalendarsService,
  ) {}

  /**
   * Parse a trip ID to determine if it's virtual or materialized
   */
  static parseTripId(id: string): ParsedTripId {
    if (id.startsWith('virtual:')) {
      const parts = id.split(':');
      return {
        type: 'virtual',
        scheduleId: parts[1],
        date: parts[2],
      };
    }
    return {
      type: 'materialized',
      tripId: id,
    };
  }

  /**
   * Build a virtual trip ID
   */
  static buildVirtualId(scheduleId: string, date: string): string {
    return `virtual:${scheduleId}:${date}`;
  }

  /**
   * Get trips (virtual + materialized) for a date range
   */
  async getTripsForDateRange(
    companyId: string,
    fromDate: Date,
    toDate: Date,
    filters?: {
      routeId?: string;
      driverId?: string;
      status?: TripStatusType;
    },
  ): Promise<VirtualTrip[]> {
    // 1. Get active schedules for this company
    const schedules = await this.prisma.tripSchedule.findMany({
      where: {
        companyId,
        isActive: true,
        ...(filters?.routeId && { routeId: filters.routeId }),
        ...(filters?.driverId && { driverId: filters.driverId }),
      },
      include: {
        route: true,
        vehicle: true,
        driver: true,
        stopTimes: {
          include: {
            routeStop: {
              include: { stop: true },
            },
          },
          orderBy: { routeStop: { sequenceNumber: 'asc' } },
        },
        exceptions: true,
      },
    });

    // 2. Expand each schedule into virtual trips
    const virtualTrips: VirtualTrip[] = [];

    for (const schedule of schedules) {
      const trips = await this.expandScheduleToVirtualTrips(
        schedule,
        fromDate,
        toDate,
      );
      virtualTrips.push(...trips);
    }

    // 3. Get materialized trips in the same range
    const materializedTrips = await this.prisma.trip.findMany({
      where: {
        companyId,
        scheduleId: { not: null },
        scheduleDate: { not: null },
        scheduledDepartureTime: { gte: fromDate, lte: toDate },
        ...(filters?.routeId && { routeId: filters.routeId }),
        ...(filters?.driverId && { driverId: filters.driverId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        route: true,
        vehicle: true,
        driver: true,
        stopTimes: {
          include: {
            routeStop: { include: { stop: true } },
          },
          orderBy: { scheduledArrival: 'asc' },
        },
      },
    });

    // 4. Build a set of materialized (scheduleId, date) pairs
    const materializedKeys = new Set(
      materializedTrips.map((t) =>
        `${t.scheduleId}:${t.scheduleDate ? formatDate(t.scheduleDate) : ''}`,
      ),
    );

    // 5. Merge: replace virtual trips with materialized where they exist
    const result: VirtualTrip[] = [];

    for (const vt of virtualTrips) {
      const key = `${vt.scheduleId}:${vt.scheduleDate}`;
      if (materializedKeys.has(key)) {
        // Use materialized trip instead
        continue;
      }
      // Apply status filter for virtual trips (they're always 'scheduled')
      if (filters?.status && filters.status !== TripStatus.SCHEDULED) {
        continue;
      }
      result.push(vt);
    }

    // Add materialized trips
    for (const mt of materializedTrips) {
      result.push(this.materializedTripToVirtualTrip(mt));
    }

    // Also get materialized trips without scheduleId (manually created)
    const manualTrips = await this.prisma.trip.findMany({
      where: {
        companyId,
        scheduleId: null,
        scheduledDepartureTime: { gte: fromDate, lte: toDate },
        ...(filters?.routeId && { routeId: filters.routeId }),
        ...(filters?.driverId && { driverId: filters.driverId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: {
        route: true,
        vehicle: true,
        driver: true,
        stopTimes: {
          include: {
            routeStop: { include: { stop: true } },
          },
          orderBy: { scheduledArrival: 'asc' },
        },
      },
    });

    for (const mt of manualTrips) {
      result.push(this.materializedTripToVirtualTrip(mt));
    }

    // 6. Sort by departure time
    result.sort((a, b) =>
      new Date(a.scheduledDepartureTime).getTime() -
      new Date(b.scheduledDepartureTime).getTime(),
    );

    return result;
  }

  /**
   * Materialize a virtual trip into the database
   */
  async materializeTrip(scheduleId: string, dateStr: string): Promise<any> {
    // Check if already materialized
    const scheduleDate = new Date(dateStr);
    const existing = await this.prisma.trip.findFirst({
      where: {
        scheduleId,
        scheduleDate,
      },
      include: {
        route: true,
        vehicle: true,
        driver: true,
        stopTimes: {
          include: {
            routeStop: { include: { stop: true } },
          },
          orderBy: { scheduledArrival: 'asc' },
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Load schedule with all related data
    const schedule = await this.prisma.tripSchedule.findUnique({
      where: { id: scheduleId },
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
        stopTimes: {
          include: {
            routeStop: true,
          },
          orderBy: { routeStop: { sequenceNumber: 'asc' } },
        },
        exceptions: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule ${scheduleId} not found`);
    }

    if (!schedule.route.currentVersion) {
      throw new BadRequestException('Route has no active version');
    }

    // Check for exception on this date
    const exception = schedule.exceptions.find(
      (ex) => formatDate(ex.date) === dateStr,
    );

    if (exception?.type === 'skip') {
      throw new BadRequestException(`Schedule is skipped on ${dateStr}`);
    }

    // Determine times (apply exception modifications if any)
    const departureTime = exception?.newDepartureTime || schedule.departureTime;
    const arrivalTime = exception?.newArrivalTime || schedule.arrivalTime;
    const vehicleId = exception?.newVehicleId || schedule.vehicleId;
    const driverId = exception?.newDriverId || schedule.driverId;

    const tripDate = new Date(dateStr);
    const scheduledDepartureTime = parseTimeToDate(tripDate, departureTime);
    const scheduledArrivalTime = parseTimeToDate(tripDate, arrivalTime);

    // Handle overnight trips
    if (scheduledArrivalTime < scheduledDepartureTime) {
      scheduledArrivalTime.setDate(scheduledArrivalTime.getDate() + 1);
    }

    const routeStops = schedule.route.currentVersion.stops;
    const scheduleStopTimesMap = new Map(
      schedule.stopTimes.map((st) => [st.routeStopId, st]),
    );

    // Create trip with stop times in a transaction
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const trip = await tx.trip.create({
        data: {
          companyId: schedule.companyId,
          routeId: schedule.routeId,
          routeVersionId: schedule.route.currentVersion!.id,
          vehicleId,
          driverId,
          scheduleId: schedule.id,
          scheduleDate,
          scheduledDepartureTime,
          scheduledArrivalTime,
          status: TripStatus.SCHEDULED,
        },
      });

      // Build stop times using schedule stop times if available, otherwise interpolate
      const stopTimesData = this.buildTripStopTimes(
        trip.id,
        routeStops,
        scheduleStopTimesMap,
        tripDate,
        scheduledDepartureTime,
        scheduledArrivalTime,
      );

      await tx.tripStopTime.createMany({
        data: stopTimesData,
      });

      return tx.trip.findUnique({
        where: { id: trip.id },
        include: {
          route: true,
          vehicle: true,
          driver: true,
          stopTimes: {
            include: {
              routeStop: { include: { stop: true } },
            },
            orderBy: { scheduledArrival: 'asc' },
          },
        },
      });
    });
  }

  /**
   * Resolve a trip ID — materialize if virtual, return if materialized
   */
  async resolveTrip(tripId: string): Promise<any> {
    const parsed = VirtualTripService.parseTripId(tripId);

    if (parsed.type === 'materialized') {
      return this.prisma.trip.findUnique({
        where: { id: parsed.tripId },
        include: {
          route: true,
          vehicle: true,
          driver: true,
          stopTimes: {
            include: {
              routeStop: { include: { stop: true } },
            },
            orderBy: { scheduledArrival: 'asc' },
          },
        },
      });
    }

    return this.materializeTrip(parsed.scheduleId!, parsed.date!);
  }

  // ==================== Private helpers ====================

  private async expandScheduleToVirtualTrips(
    schedule: any,
    fromDate: Date,
    toDate: Date,
  ): Promise<VirtualTrip[]> {
    // Get raw dates
    let dates: Date[];
    const scheduleStart = schedule.validFrom > fromDate ? schedule.validFrom : fromDate;
    const scheduleEnd = schedule.validTo && schedule.validTo < toDate ? schedule.validTo : toDate;

    if (schedule.scheduleType === 'single') {
      dates = getSingleDate(schedule.validFrom);
      // Filter by date range
      dates = dates.filter((d) => d >= fromDate && d <= toDate);
    } else if (schedule.rrule) {
      dates = expandRRule(schedule.rrule, scheduleStart, scheduleEnd);
    } else {
      dates = [];
    }

    // Apply calendar modifiers
    const modifiers = schedule.calendarModifiers as unknown as CalendarModifier[];
    if (modifiers && Array.isArray(modifiers) && modifiers.length > 0) {
      dates = await this.applyCalendarModifiers(dates, modifiers);
    }

    // Build exception map
    const exceptionMap = new Map<string, any>();
    for (const ex of schedule.exceptions) {
      exceptionMap.set(formatDate(ex.date), ex);
    }

    // Build schedule stop times map
    const scheduleStopTimesMap = new Map(
      (schedule.stopTimes || []).map((st: any) => [st.routeStopId, st]),
    );

    const virtualTrips: VirtualTrip[] = [];

    for (const date of dates) {
      const dateStr = formatDate(date);
      const exception = exceptionMap.get(dateStr);

      // Skip if there's a skip exception
      if (exception?.type === 'skip') {
        continue;
      }

      // Apply modifications if present
      const departureTime = exception?.newDepartureTime || schedule.departureTime;
      const arrivalTime = exception?.newArrivalTime || schedule.arrivalTime;
      const vehicleId = exception?.newVehicleId || schedule.vehicleId;
      const driverId = exception?.newDriverId || schedule.driverId;

      const tripDate = new Date(dateStr);
      const scheduledDepartureTime = parseTimeToDate(tripDate, departureTime);
      const scheduledArrivalTime = parseTimeToDate(tripDate, arrivalTime);

      if (scheduledArrivalTime < scheduledDepartureTime) {
        scheduledArrivalTime.setDate(scheduledArrivalTime.getDate() + 1);
      }

      // Build virtual stop times
      const stopTimes = this.buildVirtualStopTimes(
        schedule.stopTimes || [],
        schedule.route,
        tripDate,
        scheduledDepartureTime,
        scheduledArrivalTime,
      );

      virtualTrips.push({
        id: VirtualTripService.buildVirtualId(schedule.id, dateStr),
        type: 'virtual',
        scheduleId: schedule.id,
        scheduleDate: dateStr,
        companyId: schedule.companyId,
        routeId: schedule.routeId,
        routeName: schedule.route?.name || '',
        vehicleId,
        driverId,
        driverName: schedule.driver
          ? `${schedule.driver.firstName} ${schedule.driver.lastName}`
          : null,
        scheduledDepartureTime: scheduledDepartureTime.toISOString(),
        scheduledArrivalTime: scheduledArrivalTime.toISOString(),
        status: TripStatus.SCHEDULED,
        stopTimes,
        isModified: !!exception,
      });
    }

    return virtualTrips;
  }

  private buildVirtualStopTimes(
    scheduleStopTimes: any[],
    route: any,
    tripDate: Date,
    departureTime: Date,
    arrivalTime: Date,
  ): VirtualStopTime[] {
    // If we have schedule stop times, use them
    if (scheduleStopTimes.length > 0) {
      return scheduleStopTimes.map((sst: any) => ({
        routeStopId: sst.routeStopId,
        stopId: sst.routeStop?.stop?.id || sst.routeStop?.stopId || '',
        stopName: sst.routeStop?.stop?.name || '',
        sequenceNumber: sst.routeStop?.sequenceNumber || 0,
        scheduledArrival: parseTimeToDate(tripDate, sst.arrivalTime).toISOString(),
        scheduledDeparture: parseTimeToDate(tripDate, sst.departureTime).toISOString(),
      }));
    }

    // Otherwise interpolate from route stops
    const routeStops = route?.currentVersion?.stops || [];
    if (routeStops.length === 0) return [];

    const totalDuration = (arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60);
    const lastStopDuration = routeStops[routeStops.length - 1]?.durationFromStart || 0;
    const durationScale = lastStopDuration > 0 ? totalDuration / lastStopDuration : 1;

    return routeStops.map((rs: any) => {
      const scaledDuration = rs.durationFromStart * durationScale;
      const arrival = new Date(departureTime.getTime() + scaledDuration * 60 * 1000);
      const departure = new Date(arrival.getTime() + 2 * 60 * 1000);

      return {
        routeStopId: rs.id,
        stopId: rs.stop?.id || rs.stopId || '',
        stopName: rs.stop?.name || '',
        sequenceNumber: rs.sequenceNumber,
        scheduledArrival: arrival.toISOString(),
        scheduledDeparture: departure.toISOString(),
      };
    });
  }

  private buildTripStopTimes(
    tripId: string,
    routeStops: any[],
    scheduleStopTimesMap: Map<string, any>,
    tripDate: Date,
    departureTime: Date,
    arrivalTime: Date,
  ): Array<{
    tripId: string;
    routeStopId: string;
    scheduledArrival: Date;
    scheduledDeparture: Date;
  }> {
    // If we have schedule stop times, use them for exact times
    if (scheduleStopTimesMap.size > 0) {
      return routeStops.map((rs) => {
        const sst = scheduleStopTimesMap.get(rs.id);
        if (sst) {
          return {
            tripId,
            routeStopId: rs.id,
            scheduledArrival: parseTimeToDate(tripDate, sst.arrivalTime),
            scheduledDeparture: parseTimeToDate(tripDate, sst.departureTime),
          };
        }
        // Interpolate for stops without explicit times
        const totalDuration = (arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60);
        const lastStopDuration = routeStops[routeStops.length - 1]?.durationFromStart || 0;
        const durationScale = lastStopDuration > 0 ? totalDuration / lastStopDuration : 1;
        const scaledDuration = rs.durationFromStart * durationScale;
        const arrival = new Date(departureTime.getTime() + scaledDuration * 60 * 1000);
        const departure = new Date(arrival.getTime() + 2 * 60 * 1000);
        return { tripId, routeStopId: rs.id, scheduledArrival: arrival, scheduledDeparture: departure };
      });
    }

    // Interpolate all from route duration
    const totalDuration = (arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60);
    const lastStopDuration = routeStops[routeStops.length - 1]?.durationFromStart || 0;
    const durationScale = lastStopDuration > 0 ? totalDuration / lastStopDuration : 1;

    return routeStops.map((rs) => {
      const scaledDuration = rs.durationFromStart * durationScale;
      const arrival = new Date(departureTime.getTime() + scaledDuration * 60 * 1000);
      const departure = new Date(arrival.getTime() + 2 * 60 * 1000);
      return { tripId, routeStopId: rs.id, scheduledArrival: arrival, scheduledDeparture: departure };
    });
  }

  private materializedTripToVirtualTrip(trip: any): VirtualTrip {
    return {
      id: trip.id,
      type: 'materialized',
      scheduleId: trip.scheduleId || '',
      scheduleDate: trip.scheduleDate ? formatDate(trip.scheduleDate) : formatDate(trip.scheduledDepartureTime),
      companyId: trip.companyId,
      routeId: trip.routeId,
      routeName: trip.route?.name || '',
      vehicleId: trip.vehicleId,
      driverId: trip.driverId,
      driverName: trip.driver
        ? `${trip.driver.firstName} ${trip.driver.lastName}`
        : null,
      scheduledDepartureTime: trip.scheduledDepartureTime.toISOString(),
      scheduledArrivalTime: trip.scheduledArrivalTime.toISOString(),
      status: trip.status,
      stopTimes: (trip.stopTimes || []).map((st: any) => ({
        routeStopId: st.routeStopId,
        stopId: st.routeStop?.stop?.id || st.routeStop?.stopId || '',
        stopName: st.routeStop?.stop?.name || '',
        sequenceNumber: st.routeStop?.sequenceNumber || 0,
        scheduledArrival: st.scheduledArrival.toISOString(),
        scheduledDeparture: st.scheduledDeparture.toISOString(),
      })),
      isModified: false,
    };
  }

  private async applyCalendarModifiers(
    dates: Date[],
    modifiers: CalendarModifier[],
  ): Promise<Date[]> {
    if (!modifiers || modifiers.length === 0) {
      return dates;
    }

    const years = [...new Set(dates.map((d) => d.getFullYear()))];
    const calendarDates = new Map<string, Set<string>>();

    for (const modifier of modifiers) {
      if (modifier.calendarId && !calendarDates.has(modifier.calendarId)) {
        const allDates = new Set<string>();
        for (const year of years) {
          try {
            const yearDates = await this.calendarsService.getCalendarDates(
              modifier.calendarId,
              year,
            );
            for (const d of yearDates) {
              allDates.add(d.date);
            }
          } catch {
            // Calendar not found, skip
          }
        }
        calendarDates.set(modifier.calendarId, allDates);
      }
    }

    return filterDatesByModifiers(dates, calendarDates, modifiers);
  }
}
