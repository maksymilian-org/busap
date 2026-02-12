import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCalendarDto, UpdateCalendarDto } from './dto/create-calendar.dto';
import { CreateCalendarEntryDto, UpdateCalendarEntryDto } from './dto/create-entry.dto';
import {
  calculateEaster,
  getEasterRelativeDate,
  getNthWeekdayOfMonth,
  parseFixedDate,
  formatDate,
} from './utils/easter.util';

export interface CalendarDate {
  date: string; // YYYY-MM-DD
  name: string;
  entryId: string;
}

@Injectable()
export class CalendarsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { country?: string; type?: string; isActive?: boolean; companyId?: string }) {
    const { country, type, isActive, companyId } = params || {};

    return this.prisma.calendar.findMany({
      where: {
        ...(country && { country }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
        ...(companyId !== undefined && { companyId }),
      },
      include: {
        _count: {
          select: { entries: true },
        },
      },
      orderBy: [{ country: 'asc' }, { type: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get calendars visible to a company (system + company-owned)
   */
  async findForCompany(companyId: string) {
    return this.prisma.calendar.findMany({
      where: {
        OR: [
          { companyId: null },   // System calendars
          { companyId },          // Company's own calendars
        ],
        isActive: true,
      },
      include: {
        _count: {
          select: { entries: true },
        },
      },
      orderBy: [{ companyId: 'asc' }, { country: 'asc' }, { type: 'asc' }, { name: 'asc' }],
    });
  }

  async findById(id: string) {
    const calendar = await this.prisma.calendar.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!calendar) {
      throw new NotFoundException(`Calendar with ID ${id} not found`);
    }

    return calendar;
  }

  async findByCode(code: string) {
    const calendar = await this.prisma.calendar.findUnique({
      where: { code },
      include: {
        entries: {
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!calendar) {
      throw new NotFoundException(`Calendar with code ${code} not found`);
    }

    return calendar;
  }

  async create(data: CreateCalendarDto) {
    const existing = await this.prisma.calendar.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictException(`Calendar with code ${data.code} already exists`);
    }

    return this.prisma.calendar.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        country: data.country,
        region: data.region,
        type: data.type,
        year: data.year,
        companyId: (data as any).companyId || null,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateCalendarDto) {
    await this.findById(id);

    return this.prisma.calendar.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.calendar.delete({
      where: { id },
    });
  }

  // Calendar Entry operations

  async createEntry(calendarId: string, data: CreateCalendarEntryDto) {
    await this.findById(calendarId);

    return this.prisma.calendarEntry.create({
      data: {
        calendarId,
        name: data.name,
        dateType: data.dateType,
        fixedDate: data.fixedDate,
        easterOffset: data.easterOffset,
        nthWeekday: data.nthWeekday ? JSON.parse(JSON.stringify(data.nthWeekday)) : undefined,
        startDate: data.startDate,
        endDate: data.endDate,
        isRecurring: data.isRecurring ?? true,
      },
    });
  }

  async updateEntry(calendarId: string, entryId: string, data: UpdateCalendarEntryDto) {
    await this.findById(calendarId);

    const entry = await this.prisma.calendarEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry || entry.calendarId !== calendarId) {
      throw new NotFoundException(`Entry with ID ${entryId} not found in calendar ${calendarId}`);
    }

    return this.prisma.calendarEntry.update({
      where: { id: entryId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.dateType && { dateType: data.dateType }),
        ...(data.fixedDate !== undefined && { fixedDate: data.fixedDate }),
        ...(data.easterOffset !== undefined && { easterOffset: data.easterOffset }),
        ...(data.nthWeekday !== undefined && { nthWeekday: data.nthWeekday ? JSON.parse(JSON.stringify(data.nthWeekday)) : null }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
      },
    });
  }

  async deleteEntry(calendarId: string, entryId: string) {
    await this.findById(calendarId);

    const entry = await this.prisma.calendarEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry || entry.calendarId !== calendarId) {
      throw new NotFoundException(`Entry with ID ${entryId} not found in calendar ${calendarId}`);
    }

    return this.prisma.calendarEntry.delete({
      where: { id: entryId },
    });
  }

  /**
   * Get all dates from a calendar for a specific year
   */
  async getCalendarDates(calendarId: string, year: number): Promise<CalendarDate[]> {
    const calendar = await this.findById(calendarId);
    const dates: CalendarDate[] = [];

    for (const entry of calendar.entries) {
      const entryDates = this.resolveEntryDates(entry, year);
      for (const date of entryDates) {
        dates.push({
          date: formatDate(date),
          name: entry.name,
          entryId: entry.id,
        });
      }
    }

    // Sort by date
    dates.sort((a, b) => a.date.localeCompare(b.date));

    return dates;
  }

  /**
   * Get dates for multiple calendars
   */
  async getCalendarsDates(calendarIds: string[], year: number): Promise<Map<string, CalendarDate[]>> {
    const result = new Map<string, CalendarDate[]>();

    for (const calendarId of calendarIds) {
      const dates = await this.getCalendarDates(calendarId, year);
      result.set(calendarId, dates);
    }

    return result;
  }

  /**
   * Check if a date is in a calendar
   */
  async isDateInCalendar(calendarId: string, date: Date): Promise<boolean> {
    const year = date.getFullYear();
    const dates = await this.getCalendarDates(calendarId, year);
    const dateStr = formatDate(date);

    return dates.some((d) => d.date === dateStr);
  }

  /**
   * Get calendar dates by code
   */
  async getCalendarDatesByCode(code: string, year: number): Promise<CalendarDate[]> {
    const calendar = await this.findByCode(code);
    return this.getCalendarDates(calendar.id, year);
  }

  /**
   * Resolve dates for a calendar entry for a specific year
   */
  private resolveEntryDates(
    entry: {
      dateType: string;
      fixedDate: string | null;
      easterOffset: number | null;
      nthWeekday: unknown;
      startDate: string | null;
      endDate: string | null;
      isRecurring: boolean;
    },
    year: number,
  ): Date[] {
    const dates: Date[] = [];

    // Handle date ranges
    if (entry.startDate && entry.endDate) {
      const startYear = parseInt(entry.startDate.split('-')[0], 10);
      const endYear = parseInt(entry.endDate.split('-')[0], 10);

      // Only include if the date range falls within the requested year
      if (year >= startYear && year <= endYear) {
        const start = new Date(entry.startDate);
        const end = new Date(entry.endDate);
        const current = new Date(start);

        while (current <= end) {
          if (current.getFullYear() === year) {
            dates.push(new Date(current));
          }
          current.setDate(current.getDate() + 1);
        }
      }

      return dates;
    }

    // Handle single dates based on type
    switch (entry.dateType) {
      case 'fixed':
        if (entry.fixedDate) {
          // Check if it's a specific year date (YYYY-MM-DD)
          if (entry.fixedDate.length > 5) {
            const specificYear = parseInt(entry.fixedDate.split('-')[0], 10);
            if (specificYear === year) {
              dates.push(parseFixedDate(entry.fixedDate, year));
            }
          } else if (entry.isRecurring) {
            // MM-DD format, recurring
            dates.push(parseFixedDate(entry.fixedDate, year));
          }
        }
        break;

      case 'easter_relative':
        if (entry.easterOffset !== null) {
          dates.push(getEasterRelativeDate(year, entry.easterOffset));
        }
        break;

      case 'nth_weekday':
        if (entry.nthWeekday) {
          const nw = entry.nthWeekday as { month: number; weekday: number; nth: number };
          const date = getNthWeekdayOfMonth(year, nw.month, nw.weekday, nw.nth);
          if (date) {
            dates.push(date);
          }
        }
        break;
    }

    return dates;
  }
}
