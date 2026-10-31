import { describe, it, expect } from "vitest";
import { Decimal } from "decimal.js";
import { calculateMenuCapacity } from "../../src/domain/capacity.js";

describe("Domain: calculateMenuCapacity (BR-08)", () => {
  it("calculates portion capacity correctly for multi-ingredient recipe", () => {
    // Menu: Es Kopi Susu
    // Recipe:
    // - Susu UHT: 150 ml (yield 100%) -> 150 ml raw per portion
    // - Espresso: 30 ml (yield 100%) -> 30 ml raw per portion
    // - Gula Aren: 20 ml (yield 100%) -> 20 ml raw per portion
    const menu = {
      menuId: "menu-1",
      menuName: "Es Kopi Susu",
      recipeItems: [
        {
          ingredientId: "susu",
          ingredientName: "Susu UHT",
          baseUnit: "ml",
          qtyUsable: "150",
          yieldPercent: "100",
        },
        {
          ingredientId: "espresso",
          ingredientName: "Espresso",
          baseUnit: "ml",
          qtyUsable: "30",
          yieldPercent: "100",
        },
        {
          ingredientId: "aren",
          ingredientName: "Gula Aren",
          baseUnit: "ml",
          qtyUsable: "20",
          yieldPercent: "100",
        },
      ],
    };

    // Stock:
    // Susu: 1000 ml -> 1000 / 150 = 6 portions (floor)
    // Espresso: 500 ml -> 500 / 30 = 16 portions (floor)
    // Aren: 200 ml -> 200 / 20 = 10 portions (floor)
    const stockMap = new Map<string, string>([
      ["susu", "1000"],
      ["espresso", "500"],
      ["aren", "200"],
    ]);

    const result = calculateMenuCapacity(menu, stockMap);

    expect(result.capacity).toBe(6);
    expect(result.hasRecipe).toBe(true);
    expect(result.bottleneck).toBeDefined();
    expect(result.bottleneck?.ingredientId).toBe("susu");
    expect(result.bottleneck?.ingredientName).toBe("Susu UHT");
    expect(result.bottleneck?.maxPortions).toBe(6);
  });

  it("factors yield loss into raw ingredient requirement (BR-02)", () => {
    // Recipe requires 70g usable chicken, yield is 70% -> raw needed = 70 * 100 / 70 = 100g
    const menu = {
      menuId: "ayam-crispy",
      menuName: "Ayam Crispy",
      recipeItems: [
        {
          ingredientId: "ayam",
          ingredientName: "Daging Ayam",
          baseUnit: "g",
          qtyUsable: "70",
          yieldPercent: "70",
        },
      ],
    };

    // Stock: 250g raw -> 250 / 100 = 2 portions (floor)
    const stockMap = new Map<string, Decimal>([["ayam", new Decimal(250)]]);

    const result = calculateMenuCapacity(menu, stockMap);

    expect(result.capacity).toBe(2);
    expect(result.bottleneck?.ingredientId).toBe("ayam");
    expect(result.bottleneck?.rawPerPortion.toFixed(3)).toBe("100.000");
  });

  it("handles out of stock bottleneck correctly (0 capacity)", () => {
    const menu = {
      menuId: "menu-roti",
      menuName: "Roti Bakar",
      recipeItems: [
        {
          ingredientId: "roti",
          ingredientName: "Roti Tawar",
          baseUnit: "pcs",
          qtyUsable: "2",
          yieldPercent: "100",
        },
        {
          ingredientId: "mentega",
          ingredientName: "Mentega",
          baseUnit: "g",
          qtyUsable: "15",
          yieldPercent: "100",
        },
      ],
    };

    // Roti has 10 pcs, but Mentega has 0
    const stockMap = new Map<string, string>([
      ["roti", "10"],
      ["mentega", "0"],
    ]);

    const result = calculateMenuCapacity(menu, stockMap);

    expect(result.capacity).toBe(0);
    expect(result.bottleneck?.ingredientId).toBe("mentega");
    expect(result.bottleneck?.maxPortions).toBe(0);
  });

  it("treats missing ingredients in stock map as 0 stock", () => {
    const menu = {
      menuId: "menu-teh",
      menuName: "Es Teh Manis",
      recipeItems: [
        {
          ingredientId: "teh",
          ingredientName: "Daun Teh",
          baseUnit: "g",
          qtyUsable: "5",
          yieldPercent: "100",
        },
      ],
    };

    // Empty stock map
    const stockMap = new Map<string, string>();

    const result = calculateMenuCapacity(menu, stockMap);

    expect(result.capacity).toBe(0);
    expect(result.bottleneck?.ingredientId).toBe("teh");
    expect(result.bottleneck?.validStockBase.isZero()).toBe(true);
  });

  it("returns 0 capacity and null bottleneck when menu has no recipe items", () => {
    const menu = {
      menuId: "menu-no-recipe",
      menuName: "Air Mineral Botol",
      recipeItems: [],
    };

    const stockMap = new Map<string, string>();

    const result = calculateMenuCapacity(menu, stockMap);

    expect(result.capacity).toBe(0);
    expect(result.hasRecipe).toBe(false);
    expect(result.bottleneck).toBeNull();
    expect(result.items).toHaveLength(0);
  });
});
