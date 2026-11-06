import { describe, it, expect } from "vitest";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  formatDateRange,
  formatToYMD,
  parseYMD,
  defaultPresets,
  calculatePopoverPosition,
} from "./calendar-utils";

describe("Calendar Utilities", () => {
  it("formats and parses YYYY-MM-DD correctly", () => {
    const date = new Date(2026, 10, 5); // 5 Nov 2026
    const str = formatToYMD(date);
    expect(str).toBe("2026-11-05");

    const parsed = parseYMD(str);
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(10);
    expect(parsed?.getDate()).toBe(5);
  });

  it("handles invalid YMD strings gracefully", () => {
    expect(parseYMD("")).toBeNull();
    expect(parseYMD("invalid-date")).toBeNull();
    expect(parseYMD("2026-99-99")).toBeNull();
    expect(parseYMD("2026-02-31")).toBeNull();
  });

  it("calculates startOfDay and endOfDay properly", () => {
    const d = new Date(2026, 4, 15, 14, 30, 45, 100);
    const start = startOfDay(d);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);

    const end = endOfDay(d);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });

  it("calculates startOfMonth and endOfMonth properly", () => {
    const d = new Date(2026, 1, 15); // Feb 2026 (non-leap year has 28 days)
    const start = startOfMonth(d);
    expect(start.getDate()).toBe(1);

    const end = endOfMonth(d);
    expect(end.getDate()).toBe(28);
  });

  it("adds and subtracts days and months correctly", () => {
    const d = new Date(2026, 0, 10);
    expect(addDays(d, 5).getDate()).toBe(15);
    expect(subDays(d, 5).getDate()).toBe(5);

    expect(addMonths(d, 2).getMonth()).toBe(2);
    expect(subMonths(d, 1).getMonth()).toBe(11);
  });

  it("verifies isSameDay, isSameMonth, and isToday", () => {
    const d1 = new Date(2026, 2, 10, 8, 0);
    const d2 = new Date(2026, 2, 10, 20, 0);
    const d3 = new Date(2026, 2, 11);

    expect(isSameDay(d1, d2)).toBe(true);
    expect(isSameDay(d1, d3)).toBe(false);
    expect(isSameMonth(d1, d3)).toBe(true);
    expect(isToday(new Date())).toBe(true);
  });

  it("checks intervals correctly regardless of start/end order", () => {
    const start = new Date(2026, 5, 1);
    const end = new Date(2026, 5, 10);
    const mid = new Date(2026, 5, 5);
    const out = new Date(2026, 5, 15);

    expect(isWithinInterval(mid, { start, end })).toBe(true);
    expect(isWithinInterval(out, { start, end })).toBe(false);
    expect(isWithinInterval(mid, { start: end, end: start })).toBe(true);
  });

  it("formats date ranges in clean human-readable format", () => {
    const sameDay = formatDateRange(new Date(2026, 10, 5), new Date(2026, 10, 5));
    expect(sameDay).toBe("5 Nov 2026");

    const sameMonth = formatDateRange(new Date(2026, 10, 1), new Date(2026, 10, 5));
    expect(sameMonth).toBe("1 - 5 Nov 2026");

    const diffMonth = formatDateRange(new Date(2026, 9, 25), new Date(2026, 10, 5));
    expect(diffMonth).toBe("25 Oct - 5 Nov 2026");

    const diffYear = formatDateRange(new Date(2025, 11, 28), new Date(2026, 0, 3));
    expect(diffYear).toBe("28 Dec 2025 - 3 Jan 2026");
  });

  it("provides standard presets with correct relative ranges", () => {
    expect(defaultPresets.today).toBeDefined();
    expect(defaultPresets.yesterday).toBeDefined();
    expect(defaultPresets.last7days).toBeDefined();
    expect(defaultPresets.last30days).toBeDefined();
    expect(defaultPresets.thisMonth).toBeDefined();
    expect(defaultPresets.lastMonth).toBeDefined();

    expect(defaultPresets.today?.text).toBe("Today");
    expect(defaultPresets.last7days?.text).toBe("Last 7 Days");
  });

  describe("calculatePopoverPosition boundary clamping", () => {
    it("prevents left-overflow when trigger is on left side with alignment=end (Image 1 bug)", () => {
      // Tablet screen width 768px, trigger on the left at x=70px, width=200px (right=270px)
      const pos = calculatePopoverPosition({
        triggerRect: { left: 70, right: 270, width: 200 },
        screenWidth: 768,
        alignment: "end",
        padding: 12,
        maxWidth: 480,
      });

      // Without clamping, 270 - 480 = -210px (cut off).
      // With clamping, viewportLeft must be clamped to at least padding (12px)!
      expect(pos.viewportLeft).toBeGreaterThanOrEqual(12);
      expect(pos.viewportRight).toBeLessThanOrEqual(768 - 12);
      expect(pos.width).toBe(480);
      expect(pos.relativeLeft).toBe(12 - 70); // -58px
    });

    it("prevents both left and right overflow on narrow mobile screen (Image 2 bug)", () => {
      // Narrow mobile screen width 360px, trigger at left=20px, width=200px (right=220px)
      const pos = calculatePopoverPosition({
        triggerRect: { left: 20, right: 220, width: 200 },
        screenWidth: 360,
        alignment: "end",
        padding: 12,
        maxWidth: 480,
        minWidth: 280,
      });

      // On 360px screen, width should adapt to 360 - 24 = 336px
      expect(pos.width).toBe(336);
      expect(pos.viewportLeft).toBe(12);
      expect(pos.viewportRight).toBe(348); // 360 - 12
    });

    it("prevents right-overflow when trigger is on far right edge with alignment=start", () => {
      // Desktop screen width 1200px, trigger at left=1050px, width=150px
      const pos = calculatePopoverPosition({
        triggerRect: { left: 1050, right: 1200, width: 150 },
        screenWidth: 1200,
        alignment: "start",
        padding: 12,
        maxWidth: 480,
      });

      // Without clamping, 1050 + 480 = 1530px (cut off on right).
      // With clamping, viewportRight must not exceed 1200 - 12 = 1188px
      expect(pos.viewportRight).toBeLessThanOrEqual(1188);
      expect(pos.viewportLeft).toBe(1200 - 480 - 12); // 708px
      expect(pos.relativeLeft).toBe(708 - 1050); // -342px
    });

    it("centers popover correctly and clamps if overflowing", () => {
      const pos = calculatePopoverPosition({
        triggerRect: { left: 500, right: 700, width: 200 },
        screenWidth: 1200,
        alignment: "center",
        padding: 12,
        maxWidth: 480,
      });

      // Center: 500 + (200 - 480) / 2 = 360px
      expect(pos.viewportLeft).toBe(360);
      expect(pos.viewportRight).toBe(360 + 480);
      expect(pos.relativeLeft).toBe(360 - 500);
    });
  });
});
