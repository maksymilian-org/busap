import { formatDate } from '../../calendars/utils/easter.util';

export interface GeneratedTrip {
  date: string; // YYYY-MM-DD
  departureTime: string; // HH:MM
  arrivalTime: string; // HH:MM
  vehicleId: string | null;
  driverId: string | null;
  isModified: boolean;
  modificationReason?: string;
}

export interface ScheduleException {
  date: Date;
  type: 'skip' | 'modify';
  newDepartureTime?: string | null;
  newArrivalTime?: string | null;
  newVehicleId?: string | null;
  newDriverId?: string | null;
  reason?: string | null;
}

/**
 * Generate trips from a schedule for the given dates
 */
export function generateTripsFromSchedule(
  dates: Date[],
  defaultDepartureTime: string,
  defaultArrivalTime: string,
  defaultVehicleId: string | null,
  defaultDriverId: string | null,
  exceptions: ScheduleException[],
): GeneratedTrip[] {
  // Create a map of exceptions by date for quick lookup
  const exceptionMap = new Map<string, ScheduleException>();
  for (const ex of exceptions) {
    exceptionMap.set(formatDate(ex.date), ex);
  }

  const trips: GeneratedTrip[] = [];

  for (const date of dates) {
    const dateStr = formatDate(date);
    const exception = exceptionMap.get(dateStr);

    // Skip if there's a skip exception
    if (exception?.type === 'skip') {
      continue;
    }

    // Apply modifications if present
    if (exception?.type === 'modify') {
      trips.push({
        date: dateStr,
        departureTime: exception.newDepartureTime || defaultDepartureTime,
        arrivalTime: exception.newArrivalTime || defaultArrivalTime,
        vehicleId: exception.newVehicleId || defaultVehicleId,
        driverId: exception.newDriverId || defaultDriverId,
        isModified: true,
        modificationReason: exception.reason || undefined,
      });
    } else {
      trips.push({
        date: dateStr,
        departureTime: defaultDepartureTime,
        arrivalTime: defaultArrivalTime,
        vehicleId: defaultVehicleId,
        driverId: defaultDriverId,
        isModified: false,
      });
    }
  }

  return trips;
}

/**
 * Parse time string (HH:MM) and combine with date to create DateTime
 */
export function parseTimeToDate(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Calculate duration between departure and arrival time in minutes
 */
export function calculateDuration(departureTime: string, arrivalTime: string): number {
  const [depHours, depMinutes] = departureTime.split(':').map(Number);
  const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);

  let duration = (arrHours * 60 + arrMinutes) - (depHours * 60 + depMinutes);

  // Handle overnight trips
  if (duration < 0) {
    duration += 24 * 60;
  }

  return duration;
}
