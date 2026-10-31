import { describe, it, expect } from "vitest";
import {
  calculateMenuCosting,
  calculateMarginStatus,
  calculateRecipeItemCost,
} from "../../src/domain/costing.js";

describe("Domain Costing Engine (T-032 / BR-01, BR-02, BR-04, BR-09)", () => {
  // Overhead per portion based on Fixture A:
  // Rp1.560.000 / 1.300 portions = Rp1.200
  const OVERHEAD_PER_PORTION = 1200;
  const TARGET_MARGIN = 50;

  describe("Fixture A Hero Menu - Es Kopi Susu Aren", () => {
    const esKopiSusuRecipe = [
      {
        ingredientId: "ing-kopi",
        qtyUsable: 18, // 18 g
        costPerBase: 180, // Rp180/g
        yieldPercent: 100,
      },
      {
        ingredientId: "ing-susu-uht",
        qtyUsable: 150, // 150 ml
        costPerBase: 18, // Rp18/ml
        yieldPercent: 100,
      },
      {
        ingredientId: "ing-gula-aren",
        qtyUsable: 20, // 20 ml
        costPerBase: 40, // Rp40/ml
        yieldPercent: 100,
      },
      {
        ingredientId: "ing-cup-set",
        qtyUsable: 1, // 1 pcs
        costPerBase: 700, // Rp700/pcs
        yieldPercent: 100,
      },
      {
        ingredientId: "ing-es-batu",
        qtyUsable: 50, // 50 g
        costPerBase: 6, // Rp6/g
        yieldPercent: 100,
      },
    ];

    it("calculates exact HPP Bahan 7.740 and HPP Penuh 8.940 (AC: Fixture A)", () => {
      const result = calculateMenuCosting({
        recipeItems: esKopiSusuRecipe,
        overheadPerPortion: OVERHEAD_PER_PORTION,
        sellingPrice: 18000,
        targetMarginPercent: TARGET_MARGIN,
      });

      // Verification of line items subtotals
      expect(result.items[0]?.subtotal?.toNumber()).toBe(3240); // Kopi 18 * 180
      expect(result.items[1]?.subtotal?.toNumber()).toBe(2700); // Susu 150 * 18
      expect(result.items[2]?.subtotal?.toNumber()).toBe(800); // Gula 20 * 40
      expect(result.items[3]?.subtotal?.toNumber()).toBe(700); // Cup 1 * 700
      expect(result.items[4]?.subtotal?.toNumber()).toBe(300); // Es 50 * 6

      // Exact Acceptance Criteria (AC: 7.740 / 8.940 persis)
      expect(result.hppBahan?.toNumber()).toBe(7740);
      expect(result.overheadPerPortion.toNumber()).toBe(1200);
      expect(result.hppPenuh?.toNumber()).toBe(8940);
      expect(result.sellingPrice.toNumber()).toBe(18000);

      // Contribution Margin: 18.000 - 8.940 = 9.060
      expect(result.marginKontribusi?.toNumber()).toBe(9060);

      // Margin Bahan %: (18.000 - 7.740) / 18.000 = 57,00%
      expect(result.marginBahanPercent?.toNumber()).toBe(57);

      // Margin Penuh %: (18.000 - 8.940) / 18.000 = 50,33%
      expect(result.marginPercent?.toNumber()).toBe(50.33);

      // Status: 50.33% >= 50% target -> AMAN
      expect(result.marginStatus).toBe("AMAN");
      expect(result.isCostComplete).toBe(true);
    });

    it("evaluates Price Shock when Susu UHT rises from Rp18 to Rp24/ml (Lampiran A.3)", () => {
      const priceShockRecipe = esKopiSusuRecipe.map((item) =>
        item.ingredientId === "ing-susu-uht" ? { ...item, costPerBase: 24 } : item
      );

      const result = calculateMenuCosting({
        recipeItems: priceShockRecipe,
        overheadPerPortion: OVERHEAD_PER_PORTION,
        sellingPrice: 18000,
        targetMarginPercent: TARGET_MARGIN,
      });

      // Susu subtotal rises by 900 (150 * 24 = 3600 vs 2700)
      expect(result.items[1]?.subtotal?.toNumber()).toBe(3600);

      // HPP Bahan: 7.740 + 900 = 8.640
      expect(result.hppBahan?.toNumber()).toBe(8640);

      // HPP Penuh: 8.640 + 1.200 = 9.840
      expect(result.hppPenuh?.toNumber()).toBe(9840);

      // Contribution Margin: 18.000 - 9.840 = 8.160
      expect(result.marginKontribusi?.toNumber()).toBe(8160);

      // Margin Bahan %: 52.00%
      expect(result.marginBahanPercent?.toNumber()).toBe(52);

      // Margin Penuh %: 45.33% < 50% target
      expect(result.marginPercent?.toNumber()).toBe(45.33);

      // Status: 45.33% >= 45% (target - 5pp) and < 50% -> WASPADA
      expect(result.marginStatus).toBe("WASPADA");
    });
  });

  describe("Fixture A Remaining Menus Costing Verification", () => {
    it("calculates Americano: HPP Bahan 3.600, HPP Penuh 4.800, CM 10.200", () => {
      const americanoRecipe = [
        { ingredientId: "kopi", qtyUsable: 14, costPerBase: 180, yieldPercent: 100 }, // 2520
        { ingredientId: "air", qtyUsable: 160, costPerBase: 0.5, yieldPercent: 100 }, // 80
        { ingredientId: "cup", qtyUsable: 1, costPerBase: 700, yieldPercent: 100 }, // 700
        { ingredientId: "es", qtyUsable: 50, costPerBase: 6, yieldPercent: 100 }, // 300
      ];

      const result = calculateMenuCosting({
        recipeItems: americanoRecipe,
        overheadPerPortion: OVERHEAD_PER_PORTION,
        sellingPrice: 15000,
        targetMarginPercent: TARGET_MARGIN,
      });

      expect(result.hppBahan?.toNumber()).toBe(3600);
      expect(result.hppPenuh?.toNumber()).toBe(4800);
      expect(result.marginKontribusi?.toNumber()).toBe(10200);
      expect(result.marginStatus).toBe("AMAN");
    });

    it("calculates Es Teh Manis: HPP Bahan 2.000, HPP Penuh 3.200, CM 4.800", () => {
      const esTehRecipe = [
        { ingredientId: "teh", qtyUsable: 2, costPerBase: 400, yieldPercent: 100 }, // 800
        { ingredientId: "gula-pasir", qtyUsable: 20, costPerBase: 16, yieldPercent: 100 }, // 320
        { ingredientId: "cup", qtyUsable: 1, costPerBase: 700, yieldPercent: 100 }, // 700
        { ingredientId: "es", qtyUsable: 30, costPerBase: 6, yieldPercent: 100 }, // 180
      ];

      const result = calculateMenuCosting({
        recipeItems: esTehRecipe,
        overheadPerPortion: OVERHEAD_PER_PORTION,
        sellingPrice: 8000,
        targetMarginPercent: TARGET_MARGIN,
      });

      expect(result.hppBahan?.toNumber()).toBe(2000);
      expect(result.hppPenuh?.toNumber()).toBe(3200);
      expect(result.marginKontribusi?.toNumber()).toBe(4800);
      expect(result.marginStatus).toBe("AMAN");
    });

    it("calculates Roti Bakar: HPP Bahan 7.300, HPP Penuh 8.500, CM 7.500", () => {
      const rotiBakarRecipe = [
        { ingredientId: "roti", qtyUsable: 2, costPerBase: 1500, yieldPercent: 100 }, // 3000
        { ingredientId: "mentega", qtyUsable: 20, costPerBase: 100, yieldPercent: 100 }, // 2000
        { ingredientId: "meses", qtyUsable: 25, costPerBase: 80, yieldPercent: 100 }, // 2000
        { ingredientId: "kertas", qtyUsable: 1, costPerBase: 300, yieldPercent: 100 }, // 300
      ];

      const result = calculateMenuCosting({
        recipeItems: rotiBakarRecipe,
        overheadPerPortion: OVERHEAD_PER_PORTION,
        sellingPrice: 16000,
        targetMarginPercent: TARGET_MARGIN,
      });

      expect(result.hppBahan?.toNumber()).toBe(7300);
      expect(result.hppPenuh?.toNumber()).toBe(8500);
      expect(result.marginKontribusi?.toNumber()).toBe(7500);
      expect(result.marginPercent?.toNumber()).toBe(46.88);
      expect(result.marginStatus).toBe("WASPADA"); // 46.88% < 50% target margin, but >= 45% (target - 5pp)
    });

    it("calculates Matcha Latte: HPP Bahan 9.300, HPP Penuh 10.500, CM 11.500", () => {
      const matchaRecipe = [
        { ingredientId: "matcha", qtyUsable: 8, costPerBase: 700, yieldPercent: 100 }, // 5600
        { ingredientId: "susu-oat", qtyUsable: 150, costPerBase: 20, yieldPercent: 100 }, // 3000
        { ingredientId: "cup", qtyUsable: 1, costPerBase: 700, yieldPercent: 100 }, // 700
      ];

      const result = calculateMenuCosting({
        recipeItems: matchaRecipe,
        overheadPerPortion: OVERHEAD_PER_PORTION,
        sellingPrice: 22000,
        targetMarginPercent: TARGET_MARGIN,
      });

      expect(result.hppBahan?.toNumber()).toBe(9300);
      expect(result.hppPenuh?.toNumber()).toBe(10500);
      expect(result.marginKontribusi?.toNumber()).toBe(11500);
      expect(result.marginStatus).toBe("AMAN");
    });

    it("calculates Croissant: HPP Bahan 11.300, HPP Penuh 12.500, CM 7.500", () => {
      const croissantRecipe = [
        { ingredientId: "croissant-beku", qtyUsable: 1, costPerBase: 10500, yieldPercent: 100 }, // 10500
        { ingredientId: "kotak", qtyUsable: 1, costPerBase: 800, yieldPercent: 100 }, // 800
      ];

      const result = calculateMenuCosting({
        recipeItems: croissantRecipe,
        overheadPerPortion: OVERHEAD_PER_PORTION,
        sellingPrice: 20000,
        targetMarginPercent: TARGET_MARGIN,
      });

      expect(result.hppBahan?.toNumber()).toBe(11300);
      expect(result.hppPenuh?.toNumber()).toBe(12500);
      expect(result.marginKontribusi?.toNumber()).toBe(7500);
      expect(result.marginStatus).toBe("BAHAYA"); // (20000 - 12500)/20000 = 37.5% < 45% (target 50 - 5pp)
    });
  });

  describe("Yield Factor & Usable Cost (BR-02)", () => {
    it("adjusts cost per usable when yield < 100%", () => {
      // 70g usable chicken breast with 70% yield and raw cost Rp50/g
      // effective cost per usable = 50 * 100 / 70 = 71.428571
      // subtotal = 70 * 71.428571 = 5000.00
      const itemCost = calculateRecipeItemCost({
        ingredientId: "ayam",
        qtyUsable: 70,
        costPerBase: 50,
        yieldPercent: 70,
      });

      expect(itemCost.hasCost).toBe(true);
      expect(itemCost.costPerUsable?.toFixed(6)).toBe("71.428571");
      expect(itemCost.subtotal?.toNumber()).toBe(5000);
    });
  });

  describe("Margin Status Thresholds (BR-09)", () => {
    it("correctly flags AMAN, WASPADA, and BAHAYA relative to target margin", () => {
      const target = 50;

      // >= target (50%) -> AMAN
      expect(calculateMarginStatus(50, target)).toBe("AMAN");
      expect(calculateMarginStatus(55, target)).toBe("AMAN");

      // target - 5pp (45%) <= margin < target (50%) -> WASPADA
      expect(calculateMarginStatus(49.9, target)).toBe("WASPADA");
      expect(calculateMarginStatus(45.0, target)).toBe("WASPADA");

      // < target - 5pp (45%) -> BAHAYA
      expect(calculateMarginStatus(44.9, target)).toBe("BAHAYA");
      expect(calculateMarginStatus(30.0, target)).toBe("BAHAYA");
      expect(calculateMarginStatus(-10, target)).toBe("BAHAYA");
    });
  });

  describe("Edge cases & Incomplete costs", () => {
    it("returns INCOMPLETE when an ingredient has no purchase cost yet", () => {
      const incompleteRecipe = [
        { ingredientId: "kopi", qtyUsable: 18, costPerBase: 180, yieldPercent: 100 },
        { ingredientId: "sirup-baru", qtyUsable: 10, costPerBase: null, yieldPercent: 100 },
      ];

      const result = calculateMenuCosting({
        recipeItems: incompleteRecipe,
        overheadPerPortion: OVERHEAD_PER_PORTION,
        sellingPrice: 18000,
        targetMarginPercent: TARGET_MARGIN,
      });

      expect(result.isCostComplete).toBe(false);
      expect(result.marginStatus).toBe("INCOMPLETE");
      expect(result.hppBahan).toBeNull();
      expect(result.hppPenuh).toBeNull();
      expect(result.marginKontribusi).toBeNull();
      expect(result.marginPercent).toBeNull();
    });

    it("returns INCOMPLETE when recipe has no items", () => {
      const result = calculateMenuCosting({
        recipeItems: [],
        overheadPerPortion: OVERHEAD_PER_PORTION,
        sellingPrice: 18000,
        targetMarginPercent: TARGET_MARGIN,
      });

      expect(result.isCostComplete).toBe(false);
      expect(result.marginStatus).toBe("INCOMPLETE");
    });

    it("handles zero or negative selling price safely without crash", () => {
      const result = calculateMenuCosting({
        recipeItems: [{ ingredientId: "kopi", qtyUsable: 18, costPerBase: 180, yieldPercent: 100 }],
        overheadPerPortion: 1000,
        sellingPrice: 0,
        targetMarginPercent: TARGET_MARGIN,
      });

      expect(result.marginPercent?.toNumber()).toBe(0);
      expect(result.marginBahanPercent?.toNumber()).toBe(0);
      expect(result.marginStatus).toBe("BAHAYA");
    });
  });
});
