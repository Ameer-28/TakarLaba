const WIB_TIMEZONE = "Asia/Jakarta";

/**
 * Returns today's date string in Asia/Jakarta timezone in "YYYY-MM-DD" format.
 */
export function todayWIBString(now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

/**
 * Returns a Date object representing the start of today in Asia/Jakarta (00:00:00.000 WIB).
 */
export function todayWIB(now: Date = new Date()): Date {
  const dateStr = todayWIBString(now);
  // Parse YYYY-MM-DD at 00:00:00.000+07:00
  return new Date(`${dateStr}T00:00:00.000+07:00`);
}

/**
 * Returns a Date object representing the end of today in Asia/Jakarta (23:59:59.999 WIB).
 */
export function endOfTodayWIB(now: Date = new Date()): Date {
  const dateStr = todayWIBString(now);
  return new Date(`${dateStr}T23:59:59.999+07:00`);
}

/**
 * Returns a Date object representing the start of a given date (or today) in Asia/Jakarta (00:00:00.000 WIB).
 */
export function startOfDayWIB(input: Date | string = new Date()): Date {
  const dateObj = parseDateInput(input);
  const dateStr = todayWIBString(dateObj);
  return new Date(`${dateStr}T00:00:00.000+07:00`);
}

/**
 * Returns a Date object representing the end of a given date (or today) in Asia/Jakarta (23:59:59.999 WIB).
 */
export function endOfDayWIB(input: Date | string = new Date()): Date {
  const dateObj = parseDateInput(input);
  const dateStr = todayWIBString(dateObj);
  return new Date(`${dateStr}T23:59:59.999+07:00`);
}

/**
 * Convert any Date or string to Date object.
 */
function parseDateInput(input: Date | string): Date {
  if (input instanceof Date) {
    return input;
  }
  // If input is YYYY-MM-DD date string, treat as WIB date
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T00:00:00.000+07:00`);
  }
  return new Date(input);
}

/**
 * Checks if a batch expiry date is expired.
 * Note: A batch expiring "today" is valid until the end of today (23:59:59.999 WIB).
 */
export function isExpired(
  expiryDate: Date | string | null | undefined,
  referenceDate: Date = new Date()
): boolean {
  if (!expiryDate) {
    return false;
  }
  const expiry = parseDateInput(expiryDate);
  const expiryDateStr = todayWIBString(expiry);
  const todayStr = todayWIBString(referenceDate);

  // Expired only if expiry date is strictly before today
  return expiryDateStr < todayStr;
}

/**
 * Checks if a batch expiry date is expiring soon (within warnDays from today).
 */
export function isExpiringSoon(
  expiryDate: Date | string | null | undefined,
  warnDays = 3,
  referenceDate: Date = new Date()
): boolean {
  if (!expiryDate) {
    return false;
  }
  const expiry = parseDateInput(expiryDate);
  const expiryDateStr = todayWIBString(expiry);
  const todayStr = todayWIBString(referenceDate);

  // Already expired is not "expiring soon"
  if (expiryDateStr < todayStr) {
    return false;
  }

  // Calculate threshold date: today + warnDays
  const threshold = new Date(todayWIB(referenceDate));
  threshold.setDate(threshold.getDate() + warnDays);
  const thresholdStr = todayWIBString(threshold);

  return expiryDateStr <= thresholdStr;
}
