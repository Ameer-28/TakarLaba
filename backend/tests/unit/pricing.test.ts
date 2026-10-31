import { describe, it, expect } from "vitest";
import {
  roundUpToStep,
  shouldTriggerMarginAlert,
  calculateOptionA,
  calculateOptionB,
} from "../../src/domain/pricing.js";

describe("Domain: Pricing & Price Shock Recommendations (BR-05, BR-06 — T-050)", () => {
  describe("roundUpToStep (BR-06 step rounding)", () => {
    it("rounds up to the nearest default step of Rp500", () => {
      expect(roundUpToStep("19680", 500).toNumber()).toBe(20000);
      expect(roundUpToStep("19500", 500).toNumber()).toBe(19500);
      expect(roundUpToStep("19501", 500).toNumber()).toBe(20000);
      expect(roundUpToStep("19001", 500).toNumber()).toBe(19500);
      expect(roundUpToStep("0", 500).toNumber()).toBe(0);
    });

    it("supports custom rounding steps (e.g. Rp1.000, Rp100)", () => {
      expect(roundUpToStep("19100", 1000).toNumber()).toBe(20000);
      expect(roundUpToStep("19000", 1000).toNumber()).toBe(19000);
      expect(roundUpToStep("18720", 100).toNumber()).toBe(18800);
      expect(roundUpToStep("18700", 100).toNumber()).toBe(18700);
    });
  });

  describe("shouldTriggerMarginAlert (BR-05)", () => {
    it("returns true when margin is strictly below target margin", () => {
      // 45.33% < 50%
      expect(shouldTriggerMarginAlert("45.33", "50.00")).toBe(true);
      expect(shouldTriggerMarginAlert(45.3, 50)).toBe(true);
      expect(shouldTriggerMarginAlert("49.99", "50.00")).toBe(true);
    });

    it("returns false when margin is equal to or greater than target margin", () => {
      // 50.33% >= 50%
      expect(shouldTriggerMarginAlert("50.33", "50.00")).toBe(false);
      expect(shouldTriggerMarginAlert("50.00", "50.00")).toBe(false);
      expect(shouldTriggerMarginAlert("60.00", "50.00")).toBe(false);
    });
  });

  describe("calculateOptionA (BR-06: Naikkan Harga)", () => {
    it("matches AC from Fixture A: recommended price is exactly Rp20.000", () => {
      // Fixture A:
      // Hero Menu: Es Kopi Susu Aren
      // Current Selling Price: Rp18.000
      // Target Margin: 50%
      // New HPP Penuh after Susu UHT price shock: Rp9.840
      // Rounding step: Rp500
      const optionA = calculateOptionA("9840", "50", "18000", 500);

      // Raw price before rounding: 9840 / 0.50 = 19680
      // Rounded up to step 500: ceil(19680 / 500) * 500 = 40 * 500 = 20000
      expect(optionA.recommendedPrice.toNumber()).toBe(20000);
      expect(optionA.priceIncrease.toNumber()).toBe(2000); // 20000 - 18000 = 2000

      // Projected Margin: (20000 - 9840) / 20000 = 10160 / 20000 = 50.8%
      expect(optionA.projectedMarginPercent.toNumber()).toBe(50.8);
      expect(optionA.projectedMarginKontribusi.toNumber()).toBe(10160);
    });

    it("handles different rounding steps properly", () => {
      const optionA100 = calculateOptionA("9840", "50", "18000", 100);
      // 19680 rounded to 100 -> 19700
      expect(optionA100.recommendedPrice.toNumber()).toBe(19700);
      expect(optionA100.priceIncrease.toNumber()).toBe(1700);

      const optionA1000 = calculateOptionA("9840", "50", "18000", 1000);
      // 19680 rounded to 1000 -> 20000
      expect(optionA1000.recommendedPrice.toNumber()).toBe(20000);
    });

    it("throws error if target margin >= 100% or negative", () => {
      expect(() => calculateOptionA("9840", "100", "18000")).toThrow(
        "Target margin tidak boleh mencapai atau melebihi 100%"
      );
      expect(() => calculateOptionA("9840", "-10", "18000")).toThrow(
        "Target margin tidak boleh bernilai negatif"
      );
    });
  });

  describe("calculateOptionB (BR-06: Tahan Harga & Efisiensi Takaran)", () => {
    it("matches AC from Fixture A: new takaran is exactly 115 ml", () => {
      // Fixture A:
      // Current Selling Price: Rp18.000
      // Target Margin: 50%
      // New HPP Penuh: Rp9.840
      // Trigger Ingredient: Susu UHT
      // Current takaran: 150 ml
      // New replacement cost: Rp24 / ml (yield 100%)
      const optionB = calculateOptionB("18000", "50", "9840", {
        id: "ing-susu-uht",
        name: "Susu UHT",
        currentTakaran: "150",
        unit: "ml",
        costPerBase: "24.000000",
        yieldPercent: "100",
      });

      // Max allowable cost = 18000 * (1 - 0.50) = 9000
      expect(optionB.maxAllowableCost.toNumber()).toBe(9000);

      // Cost saving needed = 9840 - 9000 = 840
      expect(optionB.costSavingNeeded.toNumber()).toBe(840);

      // Reduced amount = ceil(840 / 24) = 35 ml
      expect(optionB.reducedAmount.toNumber()).toBe(35);

      // New takaran = 150 - 35 = 115 ml!
      expect(optionB.newTakaran.toNumber()).toBe(115);
      expect(optionB.unit).toBe("ml");

      // Reduction % = (35 / 150) * 100 = 23.33%
      expect(optionB.reductionPercent.toNumber()).toBe(23.33);

      // 23.33% <= 50% -> Feasible!
      expect(optionB.isFeasible).toBe(true);
      expect(optionB.infeasibleReason).toBeUndefined();

      // Projected HPP Penuh = 9840 - (35 * 24) = 9840 - 840 = 9000
      expect(optionB.projectedHppPenuh.toNumber()).toBe(9000);
      // Projected Margin = (18000 - 9000) / 18000 = 50%
      expect(optionB.projectedMarginPercent.toNumber()).toBe(50);
    });

    it("marks as infeasible when takaran reduction exceeds 50%", () => {
      // Scenario: Current takaran 50g, need to save Rp1.500, cost Rp20/g
      // 1500 / 20 = 75g reduction needed, which exceeds 50g current takaran
      const optionB = calculateOptionB("15000", "50", "9000", {
        id: "ing-matcha",
        name: "Bubuk Matcha",
        currentTakaran: "50",
        unit: "g",
        costPerBase: "20.000000",
        yieldPercent: "100",
      });

      expect(optionB.reducedAmount.toNumber()).toBe(75);
      expect(optionB.newTakaran.toNumber()).toBe(0); // cannot go below 0
      expect(optionB.reductionPercent.toNumber()).toBe(150); // 150% > 50%
      expect(optionB.isFeasible).toBe(false);
      expect(optionB.infeasibleReason).toContain("Pengurangan takaran melebihi 50%");
    });

    it("correctly handles ingredient with yield less than 100%", () => {
      // Scenario: Fresh lemon with 80% yield
      // Base cost: Rp8/g
      // Effective usable cost: 8 * 100 / 80 = Rp10/g
      // Saving needed: Rp250
      // Reduced amount: ceil(250 / 10) = 25g
      const optionB = calculateOptionB("20000", "50", "10250", {
        id: "ing-lemon",
        name: "Lemon Segar",
        currentTakaran: "100",
        unit: "g",
        costPerBase: "8.000000",
        yieldPercent: "80", // 80% yield
      });

      expect(optionB.costSavingNeeded.toNumber()).toBe(250);
      expect(optionB.reducedAmount.toNumber()).toBe(25);
      expect(optionB.newTakaran.toNumber()).toBe(75);
      expect(optionB.isFeasible).toBe(true);
    });

    it("returns zero reduction when cost already satisfies target margin", () => {
      // HPP Penuh 8000 <= Max cost 9000
      const optionB = calculateOptionB("18000", "50", "8000", {
        id: "ing-susu",
        name: "Susu UHT",
        currentTakaran: "150",
        unit: "ml",
        costPerBase: "18.000000",
        yieldPercent: "100",
      });

      expect(optionB.costSavingNeeded.toNumber()).toBe(0);
      expect(optionB.reducedAmount.toNumber()).toBe(0);
      expect(optionB.newTakaran.toNumber()).toBe(150);
      expect(optionB.isFeasible).toBe(true);
    });
  });
});
