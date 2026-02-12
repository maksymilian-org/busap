/**
 * Calculate Easter Sunday date for a given year using the Anonymous Gregorian algorithm
 * (Meeus/Jones/Butcher algorithm)
 *
 * @param year - The year to calculate Easter for
 * @returns Date object for Easter Sunday
 */
export function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Calculate a date relative to Easter Sunday
 *
 * @param year - The year to calculate for
 * @param offset - Days offset from Easter (negative for before, positive for after)
 * @returns Date object for the relative date
 */
export function getEasterRelativeDate(year: number, offset: number): Date {
  const easter = calculateEaster(year);
  const result = new Date(easter);
  result.setDate(result.getDate() + offset);
  return result;
}

/**
 * Get the nth weekday of a given month
 *
 * @param year - The year
 * @param month - The month (1-12)
 * @param weekday - The day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @param nth - Which occurrence (1-5, or negative for from end of month)
 * @returns Date object or null if the nth occurrence doesn't exist
 */
export function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  nth: number,
): Date | null {
  if (nth === 0) return null;

  const firstOfMonth = new Date(year, month - 1, 1);
  const lastOfMonth = new Date(year, month, 0);

  if (nth > 0) {
    // Count from the beginning
    const firstWeekday = firstOfMonth.getDay();
    let diff = weekday - firstWeekday;
    if (diff < 0) diff += 7;

    const day = 1 + diff + (nth - 1) * 7;
    if (day > lastOfMonth.getDate()) return null;

    return new Date(year, month - 1, day);
  } else {
    // Count from the end
    const lastWeekday = lastOfMonth.getDay();
    let diff = lastWeekday - weekday;
    if (diff < 0) diff += 7;

    const day = lastOfMonth.getDate() - diff + (nth + 1) * 7;
    if (day < 1) return null;

    return new Date(year, month - 1, day);
  }
}

/**
 * Parse a fixed date string (MM-DD or YYYY-MM-DD) to a Date for a given year
 *
 * @param dateStr - Date string in MM-DD or YYYY-MM-DD format
 * @param year - Year to use (only used if format is MM-DD)
 * @returns Date object
 */
export function parseFixedDate(dateStr: string, year: number): Date {
  if (dateStr.length === 5) {
    // MM-DD format
    const [month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  } else {
    // YYYY-MM-DD format
    const [y, month, day] = dateStr.split('-').map(Number);
    return new Date(y, month - 1, day);
  }
}

/**
 * Format a date to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if two dates are the same day (ignoring time)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is within a date range (inclusive)
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  return d >= start && d <= end;
}
