import { format as formatTz, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { addDays, startOfDay, isSameDay } from 'date-fns';

const BUSINESS_TIMEZONE = process.env.NEXT_PUBLIC_BUSINESS_TIMEZONE || 'Africa/Casablanca';
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Get the effective timezone to use.
 * In Prod: Forced Business Timezone (Africa/Casablanca).
 * In Dev: Local system timezone.
 */
export const getTimezone = (): string => {
  if (IS_DEV) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return BUSINESS_TIMEZONE;
};

/**
 * Get "Now" as a standard JS Date object (UTC timestamp).
 */
export const getNow = (): Date => {
  return new Date();
};

/**
 * Converts a "Business Time" string input (from datetime-local) to a UTC ISO String for storage.
 * e.g. "2024-05-20T10:00" (Morocco Time) -> "2024-05-20T09:00:00.000Z" (UTC)
 */
export const toUTCISO = (dateString: string): string => {
  if (!dateString) return '';
  const timeZone = getTimezone();
  // Treat the string as if it is in the business timezone, then convert to UTC
  const utcDate = fromZonedTime(dateString, timeZone);
  return utcDate.toISOString();
};

/**
 * Converts a stored UTC ISO String to a "Business Time" string for input (datetime-local).
 * e.g. "2024-05-20T09:00:00.000Z" (UTC) -> "2024-05-20T10:00" (Morocco Time)
 */
export const toBusinessInputString = (isoStringOrDate: string | Date | undefined): string => {
  if (!isoStringOrDate) return '';
  const date = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate;
  const timeZone = getTimezone();
  // Convert UTC date to Business Timezone and format for input
  return formatTz(date, "yyyy-MM-dd'T'HH:mm", { timeZone });
};

/**
 * Formats a stored UTC date for display in Business Time.
 * e.g. "20 May 2024 10:00"
 */
export const formatInBusinessTime = (isoStringOrDate: string | Date | undefined, formatStr: string = 'dd MMM yyyy HH:mm'): string => {
  if (!isoStringOrDate) return '';
  const date = typeof isoStringOrDate === 'string' ? new Date(isoStringOrDate) : isoStringOrDate;
  const timeZone = getTimezone();
  return formatTz(date, formatStr, { timeZone });
};

/**
 * Check if a rental is "Starting Today" in Business Time.
 */
export const isStartingToday = (utcDateStr: string): boolean => {
    if (!utcDateStr) return false;
    const date = new Date(utcDateStr);
    const timeZone = getTimezone();
    const now = new Date();

    // Get "Today" in business timezone
    const nowInTz = toZonedTime(now, timeZone);
    const dateInTz = toZonedTime(date, timeZone);

    return isSameDay(nowInTz, dateInTz);
};

/**
 * Check if a rental is "Starting Tomorrow" in Business Time.
 */
export const isStartingTomorrow = (utcDateStr: string): boolean => {
    if (!utcDateStr) return false;
    const date = new Date(utcDateStr);
    const timeZone = getTimezone();
    const now = new Date();

    const nowInTz = toZonedTime(now, timeZone);
    const dateInTz = toZonedTime(date, timeZone);
    
    const tomorrowInTz = addDays(nowInTz, 1);
    
    return isSameDay(tomorrowInTz, dateInTz);
};

/**
 * Check if a rental is Overdue (Return Date < Now) in strict timestamp terms.
 * Since both are UTC timestamps, we can compare directly.
 */
export const isOverdue = (returnDateUtcStr: string): boolean => {
    if (!returnDateUtcStr) return false;
    return new Date(returnDateUtcStr) < new Date(); 
};
