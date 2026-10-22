import { describe, it, expect } from "vitest";
import {
  toMoney,
  toQuantity,
  toCostPerBase,
  toPercent,
  roundToStep,
  toMoneyString,
  toQuantityString,
  toCostPerBaseString,
  safeDecimal,
  Decimal,
} from "../../src/lib/money.js";

describe("Money Library - HALF_UP Rounding and Step Calculations", () => {
  describe("toMoney (2 decimal places HALF_UP)", () => {
    it("rounds up at exactly half (0.005 -> 0.01)", () => {
      expect(toMoney("1.005").toString()).toBe("1.01");
      expect(toMoney("2.555").toString()).toBe("2.56");
      expect(toMoney("100.125").toString()).toBe("100.13");
    });

    it("rounds down below half (0.004 -> 0.00)", () => {
      expect(toMoney("1.004").toString()).toBe("1");
      expect(toMoney("2.554").toString()).toBe("2.55");
      expect(toMoney("100.1249").toString()).toBe("100.12");
    });

    it("handles negative numbers with symmetric HALF_UP rounding", () => {
      expect(toMoney("-1.005").toString()).toBe("-1.01");
      expect(toMoney("-1.004").toString()).toBe("-1");
    });

    it("accepts number, string, and Decimal inputs", () => {
      expect(toMoney(15000).toString()).toBe("15000");
      expect(toMoney("15000.50").toString()).toBe("15000.5");
      expect(toMoney(new Decimal("15000.50")).toString()).toBe("15000.5");
    });
  });

  describe("toQuantity (3 decimal places HALF_UP)", () => {
    it("rounds inventory quantities accurately to 3 decimals", () => {
      expect(toQuantity("0.1235").toString()).toBe("0.124");
      expect(toQuantity("0.1234").toString()).toBe("0.123");
      expect(toQuantity("1.5000").toString()).toBe("1.5");
    });
  });

  describe("toCostPerBase (6 decimal places HALF_UP)", () => {
    it("preserves high precision cost per base unit to 6 decimals", () => {
      expect(toCostPerBase("15.1234565").toString()).toBe("15.123457");
      expect(toCostPerBase("15.1234564").toString()).toBe("15.123456");
    });
  });

  describe("toPercent (2 decimal places HALF_UP)", () => {
    it("rounds percentages to 2 decimals", () => {
      expect(toPercent("45.255").toString()).toBe("45.26");
      expect(toPercent("45.254").toString()).toBe("45.25");
      expect(toPercent("50.000").toString()).toBe("50");
    });
  });

  describe("roundToStep (Business Price Rounding BR-06)", () => {
    it("rounds to nearest 500 using HALF_UP", () => {
      // 19740 is closer to 19500 than 20000: 19740 / 500 = 39.48 -> 39 -> 19500
      expect(roundToStep(19740, 500).toString()).toBe("19500");
      // 19750 is midpoint: 19750 / 500 = 39.5 -> 40 -> 20000
      expect(roundToStep(19750, 500).toString()).toBe("20000");
      // 19760: 19760 / 500 = 39.52 -> 40 -> 20000
      expect(roundToStep(19760, 500).toString()).toBe("20000");
      // 19240: 19240 / 500 = 38.48 -> 38 -> 19000
      expect(roundToStep(19240, 500).toString()).toBe("19000");
      // 19250: 19250 / 500 = 38.5 -> 39 -> 19500
      expect(roundToStep(19250, 500).toString()).toBe("19500");
    });

    it("rounds with step 100", () => {
      expect(roundToStep(19740, 100).toString()).toBe("19700");
      expect(roundToStep(19750, 100).toString()).toBe("19800");
    });

    it("rounds with step 1000", () => {
      expect(roundToStep(19499, 1000).toString()).toBe("19000");
      expect(roundToStep(19500, 1000).toString()).toBe("20000");
    });

    it("returns original rounded money if step is 0 or negative", () => {
      expect(roundToStep("15250.55", 0).toString()).toBe("15250.55");
      expect(roundToStep("15250.55", -100).toString()).toBe("15250.55");
    });
  });

  describe("String Formatting Helpers", () => {
    it("formats money to fixed 2 decimal places string", () => {
      expect(toMoneyString("20000")).toBe("20000.00");
      expect(toMoneyString(15000.5)).toBe("15000.50");
      expect(toMoneyString("100.126")).toBe("100.13");
    });

    it("formats quantity to fixed 3 decimal places string", () => {
      expect(toQuantityString("1.5")).toBe("1.500");
      expect(toQuantityString(25)).toBe("25.000");
    });

    it("formats costPerBase to fixed 6 decimal places string", () => {
      expect(toCostPerBaseString("12.3456789")).toBe("12.345679");
      expect(toCostPerBaseString(10)).toBe("10.000000");
    });
  });

  describe("safeDecimal Validation", () => {
    it("rejects NaN and Infinity", () => {
      expect(() => safeDecimal(NaN)).toThrow(TypeError);
      expect(() => safeDecimal(Infinity)).toThrow(TypeError);
    });
  });
});
