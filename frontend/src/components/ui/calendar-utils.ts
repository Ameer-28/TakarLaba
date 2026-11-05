// --- Pure Date Helpers (Zero-dependency, timezone-safe) ---
export interface RangeValue {
  start: Date | null;
  end: Date | null;
}

export interface PresetItem {
  text: string;
  start: Date;
  end: Date;
}

export interface PresetsMap {
  [key: string]: PresetItem;
}

export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function endOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function startOfWeek(d: Date, { weekStartsOn = 1 }: { weekStartsOn?: number } = {}): Date {
  const r = startOfDay(d);
  const day = r.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  r.setDate(r.getDate() - diff);
  return r;
}

export function endOfWeek(d: Date, { weekStartsOn = 1 }: { weekStartsOn?: number } = {}): Date {
  const start = startOfWeek(d, { weekStartsOn });
  const r = new Date(start);
  r.setDate(r.getDate() + 6);
  r.setHours(23, 59, 59, 999);
  return r;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function subDays(d: Date, n: number): Date {
  return addDays(d, -n);
}

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

export function subMonths(d: Date, n: number): Date {
  return addMonths(d, -n);
}

export function addWeeks(d: Date, n: number): Date {
  return addDays(d, n * 7);
}

export function subWeeks(d: Date, n: number): Date {
  return addDays(d, -n * 7);
}

export function addYears(d: Date, n: number): Date {
  const r = new Date(d);
  r.setFullYear(r.getFullYear() + n);
  return r;
}

export function subYears(d: Date, n: number): Date {
  return addYears(d, -n);
}

export function subMinutes(d: Date, n: number): Date {
  return new Date(d.getTime() - n * 60 * 1000);
}

export function subHours(d: Date, n: number): Date {
  return new Date(d.getTime() - n * 60 * 60 * 1000);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

export function isEqual(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

export function isWithinInterval(d: Date, interval: { start: Date; end: Date }): boolean {
  const t = startOfDay(d).getTime();
  const s = startOfDay(interval.start).getTime();
  const e = startOfDay(interval.end).getTime();
  return s <= e ? t >= s && t <= e : t >= e && t <= s;
}

export const MONTH_NAMES_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export const MONTH_NAMES_FULL = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function formatDateRange(start: Date, end: Date): string {
  const sameDay = isSameDay(start, end);
  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = MONTH_NAMES_SHORT[start.getMonth()] ?? "";
  const endMonth = MONTH_NAMES_SHORT[end.getMonth()] ?? "";
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (sameDay) {
    return `${startDay} ${startMonth} ${startYear}`;
  }

  if (startYear === endYear) {
    if (start.getMonth() === end.getMonth()) {
      return `${startDay} - ${endDay} ${startMonth} ${startYear}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
  }

  return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
}

export function formatToYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseYMD(str: string): Date | null {
  if (!str) return null;
  const parts = str.trim().split("-");
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return null;
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}

export const defaultPresets: PresetsMap = {
  today: {
    text: "Hari Ini",
    start: startOfDay(new Date()),
    end: endOfDay(new Date()),
  },
  yesterday: {
    text: "Kemarin",
    start: startOfDay(subDays(new Date(), 1)),
    end: endOfDay(subDays(new Date(), 1)),
  },
  last7days: {
    text: "7 Hari Terakhir",
    start: startOfDay(subDays(new Date(), 6)),
    end: endOfDay(new Date()),
  },
  last30days: {
    text: "30 Hari Terakhir",
    start: startOfDay(subDays(new Date(), 29)),
    end: endOfDay(new Date()),
  },
  thisMonth: {
    text: "Bulan Ini",
    start: startOfMonth(new Date()),
    end: endOfDay(new Date()),
  },
  lastMonth: {
    text: "Bulan Lalu",
    start: startOfMonth(subMonths(new Date(), 1)),
    end: endOfMonth(subMonths(new Date(), 1)),
  },
};
