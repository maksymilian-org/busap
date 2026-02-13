import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarsService } from '../calendars/calendars.service';
import { CreateScheduleDto, UpdateScheduleDto, CalendarModifierDto, ScheduleStopTimeDto } from './dto/create-schedule.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
import {
  expandRRule,
  getSingleDate,
  filterDatesByModifiers,
  CalendarModifier,
} from './utils/rrule.util';
import {
  generateTripsFromSchedule,
  parseTimeToDate,
  GeneratedTrip,
  ScheduleException,
} from './utils/trip-generator.util';
import { formatDate } from '../calendars/utils/easter.util';
import { TripStatus } from '@busap/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class SchedulesService {
  constructor(
    private prisma: PrismaService,
    private calendarsService: CalendarsService,
  ) {}

  async findAll(params?: { companyId?: string; routeId?: string; isActive?: boolean }) {
    const { companyId, routeId, isActive } = params || {};

    return this.prisma.tripSchedule.findMany({
      where: {
        ...(companyId && { companyId }),
        ...(routeId && { routeId }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        route: true,
        vehicle: true,
        driver: true,
        stopTimes: {
          include: {
            routeStop: { include: { stop: true } },
          },
          orderBy: { routeStop: { sequenceNumber: 'asc' } },
        },
        _count: {
          select: {
            exceptions: true,
            generatedTrips: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const schedule = await this.prisma.tripSchedule.findUnique({
      where: { id },
      include: {
        company: true,
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
            routeStop: { include: { stop: true } },
          },
          orderBy: { routeStop: { sequenceNumber: 'asc' } },
        },
        exceptions: {
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    return schedule;
  }

  async create(data: CreateScheduleDto) {
    // Validate route belongs to company
    const route = await this.prisma.route.findUnique({
      where: { id: data.routeId },
    });

    if (!route || route.companyId !== data.companyId) {
      throw new BadRequestException('Route does not belong to the specified company');
    }

    // Validate vehicle if provided
    if (data.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: data.vehicleId },
      });
      if (!vehicle || vehicle.companyId !== data.companyId) {
        throw new BadRequestException('Vehicle does not belong to the specified company');
      }
    }

    // Validate driver if provided
    if (data.driverId) {
      const driver = await this.prisma.companyUser.findFirst({
        where: {
          userId: data.driverId,
          companyId: data.companyId,
          role: 'driver',
        },
      });
      if (!driver) {
        throw new BadRequestException('Driver is not a driver for the specified company');
      }
    }

    // Validate RRULE if provided
    if (data.scheduleType === 'recurring' && !data.rrule) {
      throw new BadRequestException('RRULE is required for recurring schedules');
    }

    // Validate stop times if provided
    if (data.stopTimes) {
      await this.validateStopTimes(data.routeId, data.stopTimes);
    }

    const schedule = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.tripSchedule.create({
        data: {
          companyId: data.companyId,
          routeId: data.routeId,
          vehicleId: data.vehicleId,
          driverId: data.driverId,
          name: data.name,
          description: data.description,
          departureTime: data.departureTime,
          arrivalTime: data.arrivalTime,
          scheduleType: data.scheduleType,
          rrule: data.rrule,
          validFrom: new Date(data.validFrom),
          validTo: data.validTo ? new Date(data.validTo) : null,
          calendarModifiers: data.calendarModifiers
            ? JSON.parse(JSON.stringify(data.calendarModifiers))
            : [],
          isActive: data.isActive ?? true,
        },
      });

      // Create stop times if provided
      if (data.stopTimes && data.stopTimes.length > 0) {
        await tx.scheduleStopTime.createMany({
          data: data.stopTimes
            .filter((st) => st.arrivalTime && st.departureTime)
            .map((st) => ({
              scheduleId: created.id,
              routeStopId: st.routeStopId,
              arrivalTime: st.arrivalTime!,
              departureTime: st.departureTime!,
            })),
        });
      }

      return created;
    });

    return this.findById(schedule.id);
  }

  private async validateStopTimes(routeId: string, stopTimes: ScheduleStopTimeDto[]) {
    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
      include: {
        currentVersion: {
          include: {
            stops: { orderBy: { sequenceNumber: 'asc' } },
          },
        },
      },
    });

    if (!route?.currentVersion) {
      throw new BadRequestException('Route has no active version');
    }

    const routeStops = route.currentVersion.stops;
    const routeStopIds = new Set(routeStops.map((s) => s.id));

    // Validate that all provided stop times reference valid route stops
    for (const st of stopTimes) {
      if (!routeStopIds.has(st.routeStopId)) {
        throw new BadRequestException(`Route stop ${st.routeStopId} does not belong to this route`);
      }
    }

    // Validate first and last stop have times
    const firstStop = routeStops[0];
    const lastStop = routeStops[routeStops.length - 1];
    const stopTimesMap = new Map(stopTimes.map((st) => [st.routeStopId, st]));

    const firstStopTime = stopTimesMap.get(firstStop.id);
    const lastStopTime = stopTimesMap.get(lastStop.id);

    if (!firstStopTime?.departureTime) {
      throw new BadRequestException('First stop must have a departure time');
    }
    if (!lastStopTime?.arrivalTime) {
      throw new BadRequestException('Last stop must have an arrival time');
    }
  }

  async update(id: string, data: UpdateScheduleDto) {
    const schedule = await this.findById(id);

    // Validate vehicle if changed
    if (data.vehicleId && data.vehicleId !== schedule.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: data.vehicleId },
      });
      if (!vehicle || vehicle.companyId !== schedule.companyId) {
        throw new BadRequestException('Vehicle does not belong to the company');
      }
    }

    // Validate driver if changed
    if (data.driverId && data.driverId !== schedule.driverId) {
      const driver = await this.prisma.companyUser.findFirst({
        where: {
          userId: data.driverId,
          companyId: schedule.companyId,
          role: 'driver',
        },
      });
      if (!driver) {
        throw new BadRequestException('Driver is not a driver for the company');
      }
    }

    // Validate stop times if provided
    if (data.stopTimes) {
      await this.validateStopTimes(schedule.routeId, data.stopTimes);
    }

    // Build update data object
    const updateData: Record<string, unknown> = {};
    if (data.vehicleId !== undefined) updateData.vehicleId = data.vehicleId;
    if (data.driverId !== undefined) updateData.driverId = data.driverId;
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.departureTime) updateData.departureTime = data.departureTime;
    if (data.arrivalTime) updateData.arrivalTime = data.arrivalTime;
    if (data.rrule !== undefined) updateData.rrule = data.rrule;
    if (data.validFrom) updateData.validFrom = new Date(data.validFrom);
    if (data.validTo !== undefined) updateData.validTo = data.validTo ? new Date(data.validTo) : null;
    if (data.calendarModifiers) updateData.calendarModifiers = JSON.parse(JSON.stringify(data.calendarModifiers));
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.tripSchedule.update({
        where: { id },
        data: updateData,
      });

      // Update stop times if provided
      if (data.stopTimes) {
        // Delete existing stop times
        await tx.scheduleStopTime.deleteMany({
          where: { scheduleId: id },
        });

        // Create new stop times
        if (data.stopTimes.length > 0) {
          await tx.scheduleStopTime.createMany({
            data: data.stopTimes
              .filter((st) => st.arrivalTime && st.departureTime)
              .map((st) => ({
                scheduleId: id,
                routeStopId: st.routeStopId,
                arrivalTime: st.arrivalTime!,
                departureTime: st.departureTime!,
              })),
          });
        }
      }
    });

    return this.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);

    // Check if there are generated trips
    const tripCount = await this.prisma.trip.count({
      where: { scheduleId: id },
    });

    if (tripCount > 0) {
      throw new BadRequestException(
        `Cannot delete schedule with ${tripCount} generated trips. Deactivate it instead.`,
      );
    }

    return this.prisma.tripSchedule.delete({
      where: { id },
    });
  }

  async duplicate(id: string) {
    const schedule = await this.findById(id);

    const newSchedule = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.tripSchedule.create({
        data: {
          companyId: schedule.companyId,
          routeId: schedule.routeId,
          vehicleId: schedule.vehicleId,
          driverId: schedule.driverId,
          name: `Kopia: ${schedule.name}`,
          description: schedule.description,
          departureTime: schedule.departureTime,
          arrivalTime: schedule.arrivalTime,
          scheduleType: schedule.scheduleType,
          rrule: schedule.rrule,
          validFrom: schedule.validFrom,
          validTo: schedule.validTo,
          calendarModifiers: schedule.calendarModifiers as any,
          isActive: false, // Duplicated schedule starts inactive
        },
      });

      // Copy stop times (but NOT exceptions)
      if (schedule.stopTimes && schedule.stopTimes.length > 0) {
        await tx.scheduleStopTime.createMany({
          data: schedule.stopTimes.map((st: { routeStopId: string; arrivalTime: string; departureTime: string }) => ({
            scheduleId: created.id,
            routeStopId: st.routeStopId,
            arrivalTime: st.arrivalTime,
            departureTime: st.departureTime,
          })),
        });
      }

      return created;
    });

    return this.findById(newSchedule.id);
  }

  // Exception management

  async createException(scheduleId: string, data: CreateExceptionDto) {
    await this.findById(scheduleId);

    const exceptionDate = new Date(data.date);

    // Check for existing exception on this date
    const existing = await this.prisma.scheduleException.findUnique({
      where: {
        scheduleId_date: {
          scheduleId,
          date: exceptionDate,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Exception already exists for ${data.date}`);
    }

    return this.prisma.scheduleException.create({
      data: {
        scheduleId,
        date: exceptionDate,
        type: data.type,
        newDepartureTime: data.newDepartureTime,
        newArrivalTime: data.newArrivalTime,
        newVehicleId: data.newVehicleId,
        newDriverId: data.newDriverId,
        reason: data.reason,
      },
    });
  }

  async deleteException(scheduleId: string, exceptionId: string) {
    const exception = await this.prisma.scheduleException.findUnique({
      where: { id: exceptionId },
    });

    if (!exception || exception.scheduleId !== scheduleId) {
      throw new NotFoundException(`Exception not found`);
    }

    return this.prisma.scheduleException.delete({
      where: { id: exceptionId },
    });
  }

  // Preview and generation

  async previewSchedule(
    id: string,
    days: number = 30,
  ): Promise<GeneratedTrip[]> {
    const schedule = await this.findById(id);

    // Calculate date range
    const now = new Date();
    const startDate = schedule.validFrom > now ? schedule.validFrom : now;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    // Use validTo if it's before our calculated end date
    const actualEndDate = schedule.validTo && schedule.validTo < endDate ? schedule.validTo : endDate;

    // Get raw dates from schedule
    let dates: Date[];
    if (schedule.scheduleType === 'single') {
      dates = getSingleDate(schedule.validFrom);
    } else if (schedule.rrule) {
      dates = expandRRule(schedule.rrule, startDate, actualEndDate);
    } else {
      dates = [];
    }

    // Apply calendar modifiers
    const modifiers = schedule.calendarModifiers as unknown as CalendarModifier[];
    if (modifiers && Array.isArray(modifiers) && modifiers.length > 0) {
      dates = await this.applyCalendarModifiers(dates, modifiers);
    }

    // Convert exceptions to the expected format
    const exceptions: ScheduleException[] = schedule.exceptions.map((ex: {
      date: Date;
      type: string;
      newDepartureTime: string | null;
      newArrivalTime: string | null;
      newVehicleId: string | null;
      newDriverId: string | null;
      reason: string | null;
    }) => ({
      date: ex.date,
      type: ex.type as 'skip' | 'modify',
      newDepartureTime: ex.newDepartureTime,
      newArrivalTime: ex.newArrivalTime,
      newVehicleId: ex.newVehicleId,
      newDriverId: ex.newDriverId,
      reason: ex.reason,
    }));

    // Generate trips
    return generateTripsFromSchedule(
      dates,
      schedule.departureTime,
      schedule.arrivalTime,
      schedule.vehicleId,
      schedule.driverId,
      exceptions,
    );
  }

  /**
   * @deprecated Use VirtualTripService instead. Trips are now generated on-the-fly.
   */
  async generateTrips(id: string, fromDate?: Date, toDate?: Date) {
    const schedule = await this.findById(id);

    if (!schedule.isActive) {
      throw new BadRequestException('Cannot generate trips from inactive schedule');
    }

    if (!schedule.vehicleId) {
      throw new BadRequestException('Schedule must have a vehicle assigned to generate trips');
    }

    if (!schedule.driverId) {
      throw new BadRequestException('Schedule must have a driver assigned to generate trips');
    }

    if (!schedule.route.currentVersion) {
      throw new BadRequestException('Route has no active version');
    }

    // Calculate date range
    const now = new Date();
    const startDate = fromDate || (schedule.validFrom > now ? schedule.validFrom : now);
    const endDate = toDate || schedule.validTo || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get preview trips
    const previewTrips = await this.previewSchedule(id, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));

    // Filter trips that already exist
    const existingTrips = await this.prisma.trip.findMany({
      where: {
        scheduleId: id,
        scheduledDepartureTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        scheduledDepartureTime: true,
      },
    });

    const existingDates = new Set(
      existingTrips.map((t) => formatDate(t.scheduledDepartureTime)),
    );

    // Filter out already generated trips
    const tripsToCreate = previewTrips.filter(
      (trip) => !existingDates.has(trip.date) && trip.vehicleId && trip.driverId,
    );

    if (tripsToCreate.length === 0) {
      return { created: 0, message: 'No new trips to create' };
    }

    // Get route version stops for stop times
    const stops = schedule.route.currentVersion.stops;

    // Create trips in transaction
    const created = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let createdCount = 0;

      for (const tripData of tripsToCreate) {
        const tripDate = new Date(tripData.date);
        const departureTime = parseTimeToDate(tripDate, tripData.departureTime);
        const arrivalTime = parseTimeToDate(tripDate, tripData.arrivalTime);

        // Handle overnight trips
        if (arrivalTime < departureTime) {
          arrivalTime.setDate(arrivalTime.getDate() + 1);
        }

        const trip = await tx.trip.create({
          data: {
            companyId: schedule.companyId,
            routeId: schedule.routeId,
            routeVersionId: schedule.route.currentVersion!.id,
            vehicleId: tripData.vehicleId!,
            driverId: tripData.driverId!,
            scheduleId: schedule.id,
            scheduledDepartureTime: departureTime,
            scheduledArrivalTime: arrivalTime,
            status: TripStatus.SCHEDULED,
            notes: tripData.isModified ? tripData.modificationReason : null,
          },
        });

        // Create stop times
        const totalDuration =
          (arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60); // in minutes
        const lastStopDuration = stops[stops.length - 1]?.durationFromStart || 0;
        const durationScale = lastStopDuration > 0 ? totalDuration / lastStopDuration : 1;

        const stopTimesData = stops.map((stop: { id: string; durationFromStart: number }) => {
          const scaledDuration = stop.durationFromStart * durationScale;
          const arrivalAt = new Date(departureTime.getTime() + scaledDuration * 60 * 1000);
          const departureAt = new Date(arrivalAt.getTime() + 2 * 60 * 1000); // 2 min dwell

          return {
            tripId: trip.id,
            routeStopId: stop.id,
            scheduledArrival: arrivalAt,
            scheduledDeparture: departureAt,
          };
        });

        await tx.tripStopTime.createMany({
          data: stopTimesData,
        });

        createdCount++;
      }

      return createdCount;
    });

    return {
      created,
      message: `Created ${created} trips from schedule`,
    };
  }

  private async applyCalendarModifiers(
    dates: Date[],
    modifiers: CalendarModifier[],
  ): Promise<Date[]> {
    if (!modifiers || modifiers.length === 0) {
      return dates;
    }

    // Get all unique years from dates
    const years = [...new Set(dates.map((d) => d.getFullYear()))];

    // Build calendar dates map
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
