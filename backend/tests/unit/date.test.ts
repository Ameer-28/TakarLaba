import { describe, it, expect } from "vitest";
import {
  todayWIB,
  todayWIBString,
  endOfTodayWIB,
  isExpired,
  isExpiringSoon,
} from "../../src/lib/date.js";

describe("Date Library - WIB Timezone and Expiry Logic", () => {
  const mockNow = new Date("2026-10-22T08:30:00.000Z"); // In UTC (15:30 WIB)

  describe("todayWIBString", () => {
    it("returns date string formatted as YYYY-MM-DD in WIB", () => {
      const dateStr = todayWIBString(mockNow);
      expect(dateStr).toBe("2026-10-22");
    });
  });

  describe("todayWIB and endOfTodayWIB", () => {
    it("returns start of day at 00:00:00.000+07:00", () => {
      const start = todayWIB(mockNow);
      expect(start.toISOString()).toBe("2026-10-21T17:00:00.000Z"); // 00:00 WIB is 17:00 UTC previous day
    });

    it("returns end of day at 23:59:59.999+07:00", () => {
      const end = endOfTodayWIB(mockNow);
      expect(end.toISOString()).toBe("2026-10-22T16:59:59.999Z"); // 23:59:59.999 WIB is 16:59:59.999 UTC
    });
  });

  describe("isExpired (FEFO Expiry Logic)", () => {
    it("returns false when expiryDate is null or undefined", () => {
      expect(isExpired(null, mockNow)).toBe(false);
      expect(isExpired(undefined, mockNow)).toBe(false);
    });

    it("returns false if expiry date is today (valid until end of today)", () => {
      expect(isExpired("2026-10-22", mockNow)).toBe(false);
      expect(isExpired(new Date("2026-10-22T00:00:00+07:00"), mockNow)).toBe(false);
    });

    it("returns true if expiry date was yesterday or earlier", () => {
      expect(isExpired("2026-10-21", mockNow)).toBe(true);
      expect(isExpired("2026-10-15", mockNow)).toBe(true);
    });

    it("returns false if expiry date is in the future", () => {
      expect(isExpired("2026-10-23", mockNow)).toBe(false);
      expect(isExpired("2026-11-01", mockNow)).toBe(false);
    });
  });

  describe("isExpiringSoon (Threshold Warning)", () => {
    it("returns false when expiryDate is null or undefined", () => {
      expect(isExpiringSoon(null, 3, mockNow)).toBe(false);
      expect(isExpiringSoon(undefined, 3, mockNow)).toBe(false);
    });

    it("returns false if already expired", () => {
      expect(isExpiringSoon("2026-10-21", 3, mockNow)).toBe(false);
    });

    it("returns true if expiring today", () => {
      expect(isExpiringSoon("2026-10-22", 3, mockNow)).toBe(true);
    });

    it("returns true if expiring within warnDays (1 to 3 days)", () => {
      expect(isExpiringSoon("2026-10-23", 3, mockNow)).toBe(true); // +1 day
      expect(isExpiringSoon("2026-10-24", 3, mockNow)).toBe(true); // +2 days
      expect(isExpiringSoon("2026-10-25", 3, mockNow)).toBe(true); // +3 days
    });

    it("returns false if expiring beyond warnDays (> 3 days)", () => {
      expect(isExpiringSoon("2026-10-26", 3, mockNow)).toBe(false); // +4 days
      expect(isExpiringSoon("2026-11-01", 3, mockNow)).toBe(false);
    });
  });
});
