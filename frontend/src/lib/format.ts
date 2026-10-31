/**
 * Formatting utilities for Indonesian currency, numbers, percentages, and dates.
 */

/**
 * Format an amount into standard Indonesian Rupiah (e.g. "Rp15.000").
 */
export function formatRupiah(
  amount: number | string | bigint | null | undefined,
  showDecimals = false
): string {
  if (amount === null || amount === undefined || amount === "") {
    return "Rp0";
  }

  const numeric = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(numeric)) {
    return "Rp0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })
    .format(numeric)
    .replace(/\s+/g, ""); // "Rp 15.000" -> "Rp15.000"
}

/**
 * Format a number using Indonesian thousand separators (e.g. "1.500" or "1.500,5").
 */
export function formatNumber(
  val: number | string | null | undefined,
  maximumFractionDigits = 2
): string {
  if (val === null || val === undefined || val === "") {
    return "0";
  }

  const numeric = typeof val === "number" ? val : Number(val);
  if (!Number.isFinite(numeric)) {
    return "0";
  }

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(numeric);
}

/**
 * Format a percentage value (e.g. "45,3%" or "50%").
 */
export function formatPercent(val: number | string | null | undefined, fractionDigits = 1): string {
  if (val === null || val === undefined || val === "") {
    return "0%";
  }

  const numeric = typeof val === "number" ? val : Number(val);
  if (!Number.isFinite(numeric)) {
    return "0%";
  }

  return `${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(numeric)}%`;
}

/**
 * Format inventory quantity with clean decimals and optional unit (e.g. "1,5 kg" or "250 ml").
 */
export function formatQuantity(val: number | string | null | undefined, unit?: string): string {
  if (val === null || val === undefined || val === "") {
    return unit ? `0 ${unit}` : "0";
  }

  const formatted = formatNumber(val, 3);
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Format a date string or Date object into human-readable Indonesian date format.
 * Example: "22 Okt 2026" or "22 Oktober 2026, 14:30"
 */
export function formatDate(
  date: string | Date | null | undefined,
  options: { includeTime?: boolean; monthFormat?: "short" | "long" } | boolean = false
): string {
  if (!date) {
    return "-";
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) {
    return "-";
  }

  const includeTime = typeof options === "boolean" ? options : (options.includeTime ?? false);
  const monthFormat = typeof options === "boolean" ? "short" : (options.monthFormat ?? "short");

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: monthFormat,
    year: "numeric",
    ...(includeTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  }).format(dateObj);
}

/**
 * Format time only (e.g. "14:30").
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) {
    return "-";
  }

  const dateObj = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(dateObj.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}
