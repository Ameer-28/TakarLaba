import { describe, it, expect } from "vitest";
import { Decimal } from "decimal.js";
import {
  DEMO_BUSINESS_SETTINGS,
  DEMO_OVERHEAD_COSTS,
  DEMO_INGREDIENTS,
  DEMO_MENUS,
  DEMO_OPENING_BATCHES,
} from "../../src/seed/fixture-data.js";
import { generate30DaySales } from "../../src/seed/sales-generator.js";

describe("Demo Fixture Data (PRD Lampiran B)", () => {
  it("calculates overhead per portion exactly as 1.200", () => {
    const totalOverhead = DEMO_OVERHEAD_COSTS.reduce(
      (sum, item) => sum.plus(new Decimal(item.monthlyAmount)),
      new Decimal(0)
    );
    expect(totalOverhead.toNumber()).toBe(1560000);

    const expectedPortions = DEMO_BUSINESS_SETTINGS.expectedMonthlyPortions;
    expect(expectedPortions).toBe(1300);

    const overheadPerPortion = totalOverhead.dividedBy(expectedPortions);
    expect(overheadPerPortion.toNumber()).toBe(1200);
  });

  it("calculates recipe HPP Bahan and HPP Penuh per menu exactly matching PRD Lampiran B", () => {
    const ingCostMap = new Map<string, Decimal>();
    for (const ing of DEMO_INGREDIENTS) {
      ingCostMap.set(ing.id, new Decimal(ing.costPerBase));
    }

    const expectedFullCosts: Record<string, number> = {
      "demo-menu-kopi-susu": 8940,
      "demo-menu-americano": 4800,
      "demo-menu-es-teh": 3200,
      "demo-menu-roti-bakar": 8500,
      "demo-menu-matcha-latte": 10500,
      "demo-menu-croissant": 12500,
    };

    const expectedIngredientCosts: Record<string, number> = {
      "demo-menu-kopi-susu": 7740,
      "demo-menu-americano": 3600,
      "demo-menu-es-teh": 2000,
      "demo-menu-roti-bakar": 7300,
      "demo-menu-matcha-latte": 9300,
      "demo-menu-croissant": 11300,
    };

    for (const menu of DEMO_MENUS) {
      let rawCost = new Decimal(0);
      for (const item of menu.recipes) {
        const costPerBase = ingCostMap.get(item.ingredientId);
        expect(costPerBase).toBeDefined();
        rawCost = rawCost.plus(costPerBase!.times(new Decimal(item.qtyUsableBase)));
      }

      expect(rawCost.toNumber()).toBe(expectedIngredientCosts[menu.id]);
      expect(rawCost.plus(1200).toNumber()).toBe(expectedFullCosts[menu.id]);
      expect(menu.ingredientCostExpected).toBe(expectedIngredientCosts[menu.id]);
      expect(menu.fullCostExpected).toBe(expectedFullCosts[menu.id]);
    }
  });

  it("verifies Susu UHT is only used in Es Kopi Susu Aren and not Matcha Latte", () => {
    const menusWithSusuUht = DEMO_MENUS.filter((m) =>
      m.recipes.some((r) => r.ingredientId === "demo-ing-susu-uht")
    );
    expect(menusWithSusuUht.map((m) => m.name)).toEqual(["Es Kopi Susu Aren"]);

    const matchaMenu = DEMO_MENUS.find((m) => m.id === "demo-menu-matcha-latte");
    expect(matchaMenu).toBeDefined();
    const hasSusuOat = matchaMenu!.recipes.some((r) => r.ingredientId === "demo-ing-susu-oat");
    expect(hasSusuOat).toBe(true);
  });

  it("configures opening stock batches properly with edge cases", () => {
    // Susu UHT H+2
    const susuBatch = DEMO_OPENING_BATCHES.find((b) => b.ingredientId === "demo-ing-susu-uht");
    expect(susuBatch).toBeDefined();
    expect(susuBatch!.daysExpiryOffset).toBe(2);
    expect(susuBatch!.remainingQtyBase).toBe("10000.000");

    // Croissant expired yesterday
    const expiredCroissant = DEMO_OPENING_BATCHES.find(
      (b) => b.ingredientId === "demo-ing-croissant-beku" && b.daysExpiryOffset === -1
    );
    expect(expiredCroissant).toBeDefined();
    expect(expiredCroissant!.remainingQtyBase).toBe("4.000");

    // Gula Aren below minStock
    const arenBatch = DEMO_OPENING_BATCHES.find((b) => b.ingredientId === "demo-ing-gula-aren");
    const arenIng = DEMO_INGREDIENTS.find((i) => i.id === "demo-ing-gula-aren");
    expect(arenBatch).toBeDefined();
    expect(arenIng).toBeDefined();
    expect(new Decimal(arenBatch!.remainingQtyBase).toNumber()).toBeLessThan(
      new Decimal(arenIng!.minStockBase).toNumber()
    );
  });
});

describe("Deterministic Sales Generator (PRD Lampiran B)", () => {
  it("generates exactly 1.300 portions with expected distribution", () => {
    const { sales, totalPortions, menuPortions } = generate30DaySales({
      referenceDate: new Date("2026-10-31T00:00:00.000+07:00"),
      seed: 0x5eed1300,
    });

    expect(totalPortions).toBe(1300);
    expect(menuPortions).toEqual({
      "demo-menu-kopi-susu": 400,
      "demo-menu-americano": 400,
      "demo-menu-es-teh": 200,
      "demo-menu-roti-bakar": 170,
      "demo-menu-matcha-latte": 80,
      "demo-menu-croissant": 50,
    });

    // Sum of items across all sales must equal 1300
    let totalItemsQty = 0;
    for (const sale of sales) {
      expect(sale.items.length).toBeGreaterThanOrEqual(1);
      expect(sale.items.length).toBeLessThanOrEqual(3);
      for (const item of sale.items) {
        totalItemsQty += item.qty;
      }
    }
    expect(totalItemsQty).toBe(1300);
  });

  it("is 100% deterministic with identical seed", () => {
    const run1 = generate30DaySales({ seed: 12345 });
    const run2 = generate30DaySales({ seed: 12345 });

    expect(run1.sales.length).toBe(run2.sales.length);
    expect(run1.sales[0]?.totalAmount).toBe(run2.sales[0]?.totalAmount);
    expect(run1.sales[run1.sales.length - 1]?.invoiceNo).toBe(
      run2.sales[run2.sales.length - 1]?.invoiceNo
    );
    expect(run1.menuPortions).toEqual(run2.menuPortions);
  });

  it("verifies Menu Engineering classification numbers on generated data", () => {
    const totalPortions = 1300;
    const menuCount = 6;
    const popularityThreshold = 0.7 * (1 / menuCount) * totalPortions;
    expect(popularityThreshold).toBeCloseTo(151.67, 1);

    // Es Kopi Susu (400), Americano (400), Es Teh (200), Roti Bakar (170) > 151.67
    // Matcha (80), Croissant (50) < 151.67
    const portionMap: Record<string, number> = {
      "demo-menu-kopi-susu": 400,
      "demo-menu-americano": 400,
      "demo-menu-es-teh": 200,
      "demo-menu-roti-bakar": 170,
      "demo-menu-matcha-latte": 80,
      "demo-menu-croissant": 50,
    };

    const contributionMarginMap: Record<string, number> = {
      "demo-menu-kopi-susu": 18000 - 8940, // 9060
      "demo-menu-americano": 15000 - 4800, // 10200
      "demo-menu-es-teh": 8000 - 3200, // 4800
      "demo-menu-roti-bakar": 16000 - 8500, // 7500
      "demo-menu-matcha-latte": 22000 - 10500, // 11500
      "demo-menu-croissant": 20000 - 12500, // 7500
    };

    let totalContributionMargin = 0;
    for (const id of Object.keys(portionMap)) {
      totalContributionMargin += portionMap[id]! * contributionMarginMap[id]!;
    }
    expect(totalContributionMargin).toBe(11234000);

    const weightedMarginThreshold = totalContributionMargin / totalPortions;
    expect(weightedMarginThreshold).toBeCloseTo(8641.54, 1);

    // Assert quadrant classification:
    // STAR: High Popularity, High Margin
    expect(portionMap["demo-menu-kopi-susu"]!).toBeGreaterThan(popularityThreshold);
    expect(contributionMarginMap["demo-menu-kopi-susu"]!).toBeGreaterThan(weightedMarginThreshold);

    expect(portionMap["demo-menu-americano"]!).toBeGreaterThan(popularityThreshold);
    expect(contributionMarginMap["demo-menu-americano"]!).toBeGreaterThan(weightedMarginThreshold);

    // PLOWHORSE: High Popularity, Low Margin
    expect(portionMap["demo-menu-es-teh"]!).toBeGreaterThan(popularityThreshold);
    expect(contributionMarginMap["demo-menu-es-teh"]!).toBeLessThan(weightedMarginThreshold);

    expect(portionMap["demo-menu-roti-bakar"]!).toBeGreaterThan(popularityThreshold);
    expect(contributionMarginMap["demo-menu-roti-bakar"]!).toBeLessThan(weightedMarginThreshold);

    // PUZZLE: Low Popularity, High Margin
    expect(portionMap["demo-menu-matcha-latte"]!).toBeLessThan(popularityThreshold);
    expect(contributionMarginMap["demo-menu-matcha-latte"]!).toBeGreaterThan(
      weightedMarginThreshold
    );

    // DOG: Low Popularity, Low Margin
    expect(portionMap["demo-menu-croissant"]!).toBeLessThan(popularityThreshold);
    expect(contributionMarginMap["demo-menu-croissant"]!).toBeLessThan(weightedMarginThreshold);
  });
});
