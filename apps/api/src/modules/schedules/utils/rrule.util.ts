import { RRule, RRuleSet, rrulestr } from 'rrule';
import { formatDate } from '../../calendars/utils/easter.util';

export interface CalendarModifier {
  type: 'exclude' | 'include_only' | 'exclude_dates';
  calendarId?: string;
  dates?: string[]; // YYYY-MM-DD format
}

/**
 * Parse an RRULE string and return dates within the specified range
 */
export function expandRRule(
  rruleString: string,
  validFrom: Date,
  validTo: Date | null,
  excludeDates: Date[] = [],
): Date[] {
  try {
    // Create RRuleSet to handle exclusions
    const rruleSet = new RRuleSet();

    // Parse the RRULE and add it to the set
    // Prepend DTSTART if not present
    let fullRrule = rruleString;
    if (!fullRrule.includes('DTSTART')) {
      const dtstart = validFrom.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      fullRrule = `DTSTART:${dtstart}\n${rruleString}`;
    }

    const rule = rrulestr(fullRrule);
    rruleSet.rrule(rule);

    // Add exclusion dates
    for (const exDate of excludeDates) {
      rruleSet.exdate(exDate);
    }

    // Calculate end date (default to 1 year if not specified)
    const endDate = validTo || new Date(validFrom.getTime() + 365 * 24 * 60 * 60 * 1000);

    // Get dates in range
    return rruleSet.between(validFrom, endDate, true);
  } catch (error) {
    console.error('Error expanding RRULE:', error);
    return [];
  }
}

/**
 * Get dates for a single occurrence (scheduleType=single)
 */
export function getSingleDate(validFrom: Date): Date[] {
  return [validFrom];
}

/**
 * Build an RRULE string from components
 */
export function buildRRule(params: {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval?: number;
  byDay?: string[]; // ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  byMonthDay?: number[];
  byMonth?: number[];
  count?: number;
  until?: Date;
}): string {
  const parts: string[] = [`FREQ=${params.frequency}`];

  if (params.interval && params.interval > 1) {
    parts.push(`INTERVAL=${params.interval}`);
  }

  if (params.byDay && params.byDay.length > 0) {
    parts.push(`BYDAY=${params.byDay.join(',')}`);
  }

  if (params.byMonthDay && params.byMonthDay.length > 0) {
    parts.push(`BYMONTHDAY=${params.byMonthDay.join(',')}`);
  }

  if (params.byMonth && params.byMonth.length > 0) {
    parts.push(`BYMONTH=${params.byMonth.join(',')}`);
  }

  if (params.count) {
    parts.push(`COUNT=${params.count}`);
  }

  if (params.until) {
    const untilStr = params.until.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    parts.push(`UNTIL=${untilStr}`);
  }

  return parts.join(';');
}

/**
 * Describe an RRULE in human-readable format
 */
export function describeRRule(rruleString: string): string {
  try {
    // Parse RRULE components
    const parts = rruleString.split(';').reduce(
      (acc, part) => {
        const [key, value] = part.split('=');
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    );

    const freq = parts['FREQ'];
    const byDay = parts['BYDAY'];
    const interval = parts['INTERVAL'] ? parseInt(parts['INTERVAL'], 10) : 1;

    const dayNames: Record<string, string> = {
      MO: 'Monday',
      TU: 'Tuesday',
      WE: 'Wednesday',
      TH: 'Thursday',
      FR: 'Friday',
      SA: 'Saturday',
      SU: 'Sunday',
    };

    let description = '';

    switch (freq) {
      case 'DAILY':
        description = interval === 1 ? 'Every day' : `Every ${interval} days`;
        break;
      case 'WEEKLY':
        if (byDay) {
          const days = byDay.split(',').map((d) => dayNames[d] || d);
          description =
            interval === 1
              ? `Weekly on ${days.join(', ')}`
              : `Every ${interval} weeks on ${days.join(', ')}`;
        } else {
          description = interval === 1 ? 'Weekly' : `Every ${interval} weeks`;
        }
        break;
      case 'MONTHLY':
        description = interval === 1 ? 'Monthly' : `Every ${interval} months`;
        break;
      case 'YEARLY':
        description = interval === 1 ? 'Yearly' : `Every ${interval} years`;
        break;
      default:
        description = rruleString;
    }

    return description;
  } catch {
    return rruleString;
  }
}

/**
 * Parse weekday string to RRule weekday constant
 */
export function parseWeekdays(weekdayStr: string): number[] {
  const dayMap: Record<string, number> = {
    SU: RRule.SU.weekday,
    MO: RRule.MO.weekday,
    TU: RRule.TU.weekday,
    WE: RRule.WE.weekday,
    TH: RRule.TH.weekday,
    FR: RRule.FR.weekday,
    SA: RRule.SA.weekday,
  };

  return weekdayStr.split(',').map((day) => dayMap[day.trim().toUpperCase()] ?? 0);
}

/**
 * Filter dates by calendar modifiers
 */
export function filterDatesByModifiers(
  dates: Date[],
  calendarDates: Map<string, Set<string>>, // calendarId -> Set of YYYY-MM-DD strings
  modifiers: CalendarModifier[],
): Date[] {
  let result = [...dates];

  for (const modifier of modifiers) {
    switch (modifier.type) {
      case 'exclude':
        if (modifier.calendarId && calendarDates.has(modifier.calendarId)) {
          const excludeDates = calendarDates.get(modifier.calendarId)!;
          result = result.filter((date) => !excludeDates.has(formatDate(date)));
        }
        break;

      case 'include_only':
        if (modifier.calendarId && calendarDates.has(modifier.calendarId)) {
          const includeDates = calendarDates.get(modifier.calendarId)!;
          result = result.filter((date) => includeDates.has(formatDate(date)));
        }
        break;

      case 'exclude_dates':
        if (modifier.dates && modifier.dates.length > 0) {
          const excludeSet = new Set(modifier.dates);
          result = result.filter((date) => !excludeSet.has(formatDate(date)));
        }
        break;
    }
  }

  return result;
}
