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

    it("throws error for non-positive conversion factor", () => {
      expect(() => toBaseQuantity(10, 0)).toThrow();
      expect(() => toBaseQuantity(10, -5)).toThrow();
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

    it("throws error for non-positive conversion factor", () => {
      expect(() => computeCostPerBase(10000, 0)).toThrow();
      expect(() => computeCostPerBase(10000, -1)).toThrow();
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

    it("throws error when yieldPercent is 0, negative, or greater than 100", () => {
      expect(() => calculateRawNeeded(100, 0)).toThrow();
      expect(() => calculateRawNeeded(100, -10)).toThrow();
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

    it("throws error when yieldPercent is out of range 1..100", () => {
      expect(() => calculateEffectiveCost(50, 0)).toThrow();
      expect(() => calculateEffectiveCost(50, 101)).toThrow();
    });
  });
});
