import { describe, it, expect } from "vitest";
import {
  calculateMenuPromoDiscount,
  buildWasteRadar,
  type ExpiringBatchInput,
  type RelatedMenuCostInput,
} from "../../src/domain/waste-radar.js";

describe("Waste Radar Domain Logic (T-200 — FR-WST-01)", () => {
  describe("calculateMenuPromoDiscount", () => {
    it("computes promo floor price and max discount according to FR-WST-01 formula", () => {
      // HPP Penuh: Rp10.000, Harga jual: Rp20.000, Min margin promo: 10%, Rounding step: 500
      // rawFloor = 10.000 / (1 - 0.10) = 11.111,11...
      // promoFloorPrice = ceil(11.111,11 / 500) * 500 = 23 * 500 = 11.500
      // maxDiscount = 20.000 - 11.500 = 8.500 (42.50%)
      const result = calculateMenuPromoDiscount(10000, 20000, 10, 500);

      expect(result.promoFloorPrice.toNumber()).toBe(11500);
      expect(result.maxDiscountAmount.toNumber()).toBe(8500);
      expect(result.maxDiscountPercent.toNumber()).toBe(42.5);
      expect(result.currentMarginPercent.toNumber()).toBe(50);
      expect(result.promoMarginPercent.toNumber()).toBeCloseTo(13.04, 2);
    });

    it("clamps max discount to zero if current selling price is at or below promo floor", () => {
      // HPP Penuh: Rp18.000, Harga jual: Rp19.000, Min margin promo: 10%
      // rawFloor = 18.000 / 0.9 = 20.000
      // promoFloorPrice = 20.000 -> maxDiscount = max(0, 19.000 - 20.000) = 0
      const result = calculateMenuPromoDiscount(18000, 19000, 10, 500);

      expect(result.promoFloorPrice.toNumber()).toBe(20000);
      expect(result.maxDiscountAmount.toNumber()).toBe(0);
      expect(result.maxDiscountPercent.toNumber()).toBe(0);
    });
  });

  describe("buildWasteRadar", () => {
    const referenceDate = new Date("2026-11-04T12:00:00.000+07:00");

    it("aggregates risk value, status, and related menus accurately", () => {
      const batches: ExpiringBatchInput[] = [
        {
          batchId: "batch-1",
          ingredientId: "ing-milk",
          ingredientName: "Susu Segar",
          category: "Dairy",
          remainingQtyBase: 5, // 5 Liter
          unit: "L",
          costPerBase: 18000, // Rp18.000 / L
          expiryDate: "2026-11-06", // 2 days left
        },
        {
          batchId: "batch-2",
          ingredientId: "ing-pastry",
          ingredientName: "Croissant Matang",
          category: "Pastry",
          remainingQtyBase: 10, // 10 Pcs
          unit: "Pcs",
          costPerBase: 8000, // Rp8.000 / Pcs
          expiryDate: "2026-11-02", // Expired 2 days ago
        },
      ];

      const menuMap = new Map<string, RelatedMenuCostInput[]>([
        [
          "ing-milk",
          [
            {
              menuId: "menu-latte",
              menuName: "Cafe Latte",
              category: "Minuman",
              sellingPrice: 22000,
              hppPenuh: 11000,
            },
          ],
        ],
        [
          "ing-pastry",
          [
            {
              menuId: "menu-croissant",
              menuName: "Butter Croissant",
              category: "Makanan",
              sellingPrice: 16000,
              hppPenuh: 9000,
            },
          ],
        ],
      ]);

      const result = buildWasteRadar(batches, menuMap, {
        warnDays: 7,
        wastePromoMinMarginPercent: 10,
        priceRoundingStep: 500,
        referenceDate,
      });

      // Summary checks
      // batch 1 risk = 5 * 18.000 = 90.000
      // batch 2 risk = 10 * 8.000 = 80.000
      // total risk = 170.000
      expect(result.summary.totalRiskValue).toBe("170000.00");
      expect(result.summary.totalExpiringBatches).toBe(2);
      expect(result.summary.totalImpactedMenus).toBe(2);
      expect(result.summary.warnDays).toBe(7);
      expect(result.summary.wastePromoMinMarginPercent).toBe("10.00");

      // Sorted: batch-2 (expired, days -2) must come before batch-1 (days 2)
      expect(result.items[0]!.batchId).toBe("batch-2");
      expect(result.items[0]!.status).toBe("EXPIRED");
      expect(result.items[0]!.daysUntilExpiry).toBe(-2);
      expect(result.items[0]!.riskValue).toBe("80000.00");
      expect(result.items[0]!.remainingQty).toBe("10.000");

      expect(result.items[1]!.batchId).toBe("batch-1");
      expect(result.items[1]!.status).toBe("EXPIRING_SOON");
      expect(result.items[1]!.daysUntilExpiry).toBe(2);
      expect(result.items[1]!.riskValue).toBe("90000.00");

      // Related menu check
      const latte = result.items[1]!.relatedMenus[0]!;
      expect(latte.menuName).toBe("Cafe Latte");
      expect(latte.sellingPrice).toBe("22000.00");
      expect(latte.hppPenuh).toBe("11000.00");
      // rawFloor = 11.000 / 0.9 = 12.222,22 -> ceil to 500 = 12.500
      expect(latte.promoFloorPrice).toBe("12500.00");
      // maxDiscount = 22.000 - 12.500 = 9.500
      expect(latte.maxDiscountAmount).toBe("9500.00");
    });
  });
});
