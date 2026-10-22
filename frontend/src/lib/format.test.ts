import { describe, it, expect } from "vitest";
import { formatRupiah, formatNumber, formatPercent, formatQuantity, formatDate } from "./format";

describe("Frontend Format Utilities", () => {
  describe("formatRupiah", () => {
    it("formats integer amounts to standard Rupiah format", () => {
      expect(formatRupiah(15000)).toMatch(/Rp\s?15\.000/);
      expect(formatRupiah("20000")).toMatch(/Rp\s?20\.000/);
      expect(formatRupiah(0)).toMatch(/Rp\s?0/);
    });

    it("formats with decimals when showDecimals is true", () => {
      const formatted = formatRupiah(15000.5, true);
      expect(formatted).toMatch(/Rp\s?15\.000,50/);
    });

    it("handles null, undefined, and invalid inputs gracefully", () => {
      expect(formatRupiah(null)).toBe("Rp0");
      expect(formatRupiah(undefined)).toBe("Rp0");
      expect(formatRupiah("invalid")).toBe("Rp0");
    });
  });

  describe("formatNumber", () => {
    it("formats numbers with Indonesian separators", () => {
      expect(formatNumber(1500)).toBe("1.500");
      expect(formatNumber("2500000")).toBe("2.500.000");
    });

    it("handles decimals with comma separator", () => {
      expect(formatNumber(12.5)).toBe("12,5");
    });
  });

  describe("formatPercent", () => {
    it("formats percentage correctly with comma decimal", () => {
      expect(formatPercent(45.3)).toBe("45,3%");
      expect(formatPercent("50")).toBe("50%");
    });
  });

  describe("formatQuantity", () => {
    it("formats quantity with optional unit string", () => {
      expect(formatQuantity(1.5, "kg")).toBe("1,5 kg");
      expect(formatQuantity(250, "ml")).toBe("250 ml");
      expect(formatQuantity(10)).toBe("10");
    });
  });

  describe("formatDate", () => {
    it("formats date object and ISO string", () => {
      const d = new Date("2026-10-22T08:00:00Z");
      const formatted = formatDate(d);
      expect(formatted).toContain("2026");
    });

    it("returns '-' for null or invalid dates", () => {
      expect(formatDate(null)).toBe("-");
      expect(formatDate("invalid-date")).toBe("-");
    });
  });
});
