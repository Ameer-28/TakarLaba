import { describe, it, expect } from "vitest";
import {
  normalizeNameKey,
  toBaseQuantity,
  computeCostPerBase,
  calculateRawNeeded,
  calculateEffectiveCost,
} from "../../src/domain/units.js";

describe("Domain Units - Conversion and Yield Calculations", () => {
  describe("normalizeNameKey", () => {
    it("trims and normalizes whitespace and casing", () => {
      expect(normalizeNameKey("  Kopi   Susu  ")).toBe("kopi susu");
      expect(normalizeNameKey("AYAM KARKAS")).toBe("ayam karkas");
      expect(normalizeNameKey("Sirup Vanila 750ml")).toBe("sirup vanila 750ml");
    });

    it("handles tabs, newlines, and multiple spaces", () => {
      expect(normalizeNameKey("\tBeras   Pandan\nWangi  \r\n")).toBe("beras pandan wangi");
    });
  });

  describe("toBaseQuantity", () => {
    it("converts purchase quantity to base units accurately", () => {
      // 2.5 kg with factor 1000 -> 2500 g
      expect(toBaseQuantity("2.5", "1000").toString()).toBe("2500");
      // 5 boxes with factor 50 -> 250 pcs
      expect(toBaseQuantity(5, 50).toString()).toBe("250");
      // 0.75 liter with factor 1000 -> 750 ml
      expect(toBaseQuantity("0.75", 1000).toString()).toBe("750");
    });

    it("handles tiny quantities and zero quantity", () => {
      expect(toBaseQuantity(0, 1000).toString()).toBe("0");
      // 0.005 kg -> 5 g
      expect(toBaseQuantity("0.005", 1000).toString()).toBe("5");
    });

    it("quantizes to 3 decimal places with HALF_UP rounding", () => {
      // 0.0004 * 1000 = 0.4 -> 0.4
      expect(toBaseQuantity("0.0004", 1000).toString()).toBe("0.4");
      // 1.0005 * 1 = 1.001 (HALF_UP at 3 decimal places)
      expect(toBaseQuantity("1.0005", 1).toString()).toBe("1.001");
      // 1.0004 * 1 = 1.000 -> 1
      expect(toBaseQuantity("1.0004", 1).toString()).toBe("1");
    });

    it("throws error for non-positive conversion factor", () => {
      expect(() => toBaseQuantity(10, 0)).toThrow();
      expect(() => toBaseQuantity(10, -5)).toThrow();
      expect(() => toBaseQuantity(10, "-100")).toThrow();
    });
  });

  describe("computeCostPerBase", () => {
    it("calculates cost per base unit with 6 decimal precision", () => {
      // Rp120,000 for 1000g -> Rp120.000000/g
      expect(computeCostPerBase("120000", "1000").toString()).toBe("120");
      // Rp15,000 for 50 pcs -> Rp300.000000/pcs
      expect(computeCostPerBase("15000", "50").toString()).toBe("300");
      // Rp25,000 for 300g -> Rp83.333333/g
      expect(computeCostPerBase("25000", "300").toString()).toBe("83.333333");
    });

    it("handles zero price and fractional price", () => {
      expect(computeCostPerBase(0, 1000).toString()).toBe("0");
      expect(computeCostPerBase("14500.50", "500").toString()).toBe("29.001");
    });

    it("rounds HALF_UP at 6th decimal place", () => {
      // 10000 / 7 = 1428.57142857... -> 1428.571429
      expect(computeCostPerBase("10000", "7").toString()).toBe("1428.571429");
      // 10000 / 3 = 3333.33333333... -> 3333.333333
      expect(computeCostPerBase("10000", "3").toString()).toBe("3333.333333");
    });

    it("handles large amounts without overflow", () => {
      expect(computeCostPerBase("1000000000", "10000").toString()).toBe("100000");
    });

    it("throws error for non-positive conversion factor", () => {
      expect(() => computeCostPerBase(10000, 0)).toThrow();
      expect(() => computeCostPerBase(10000, -1)).toThrow();
      expect(() => computeCostPerBase(10000, "-0.01")).toThrow();
    });
  });

  describe("calculateRawNeeded (BR-02 Yield Accounting)", () => {
    it("computes raw amount needed based on yield percentage", () => {
      // 70g usable chicken with 70% yield -> 100g raw needed
      expect(calculateRawNeeded("70", "70").toString()).toBe("100");
      // 40ml fresh orange juice with 40% yield -> 100ml raw needed
      expect(calculateRawNeeded("40", "40").toString()).toBe("100");
      // 50g coffee beans with 100% yield -> 50g raw needed
      expect(calculateRawNeeded("50", "100").toString()).toBe("50");
    });

    it("handles fractional yield and applies HALF_UP to 3 decimal places", () => {
      // 125g usable with 62.5% yield -> 125 * 100 / 62.5 = 200g
      expect(calculateRawNeeded("125", "62.5").toString()).toBe("200");
      // 75g usable with 85.5% yield -> 75 * 100 / 85.5 = 87.71929... -> 87.719g
      expect(calculateRawNeeded("75", "85.5").toString()).toBe("87.719");
    });

    it("supports boundary yields (1% and 100%)", () => {
      // 1g usable with 1% yield -> 100g raw needed
      expect(calculateRawNeeded("1", "1").toString()).toBe("100");
      // 100g usable with 100% yield -> 100g raw needed
      expect(calculateRawNeeded("100", "100").toString()).toBe("100");
    });

    it("throws error when yieldPercent is 0, negative, or greater than 100", () => {
      expect(() => calculateRawNeeded(100, 0)).toThrow();
      expect(() => calculateRawNeeded(100, -10)).toThrow();
      expect(() => calculateRawNeeded(100, 100.01)).toThrow();
      expect(() => calculateRawNeeded(100, 105)).toThrow();
    });
  });

  describe("calculateEffectiveCost", () => {
    it("computes effective usable cost based on yield percentage", () => {
      // costPerBase Rp50 with 50% yield -> Rp100 effective cost
      expect(calculateEffectiveCost("50", "50").toString()).toBe("100");
      // costPerBase Rp70 with 70% yield -> Rp100 effective cost
      expect(calculateEffectiveCost("70", "70").toString()).toBe("100");
      // costPerBase Rp100 with 100% yield -> Rp100 effective cost
      expect(calculateEffectiveCost("100", "100").toString()).toBe("100");
    });

    it("handles fractional yields and 6-decimal precision", () => {
      // costPerBase Rp50 with 78.5% yield -> 50 * 100 / 78.5 = 63.6942675... -> 63.694268
      expect(calculateEffectiveCost("50", "78.5").toString()).toBe("63.694268");
    });

    it("supports boundary yields (1% and 100%)", () => {
      // costPerBase Rp10 with 1% yield -> 10 * 100 / 1 = Rp1000
      expect(calculateEffectiveCost("10", "1").toString()).toBe("1000");
      // costPerBase Rp50 with 100% yield -> Rp50
      expect(calculateEffectiveCost("50", "100").toString()).toBe("50");
    });

    it("throws error when yieldPercent is out of range 1..100", () => {
      expect(() => calculateEffectiveCost(50, 0)).toThrow();
      expect(() => calculateEffectiveCost(50, -5)).toThrow();
      expect(() => calculateEffectiveCost(50, 100.1)).toThrow();
      expect(() => calculateEffectiveCost(50, 101)).toThrow();
    });
  });
});
