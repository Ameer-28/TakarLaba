import { describe, it, expect } from "vitest";
import { Decimal } from "decimal.js";
import {
  calculateRawQuantity,
  validateAndAggregateRawNeeds,
  allocateSaleItemsFefo,
  type MenuWithRecipes,
} from "../../src/domain/checkout.js";
import { InsufficientStockError, ValidationError, NotFoundError } from "../../src/lib/errors.js";

describe("domain/checkout", () => {
  it("calculates raw quantity correctly based on yield (BR-02)", () => {
    // 100g usable with 80% yield -> 100 / 0.8 = 125g
    const raw = calculateRawQuantity(100, 80, 1);
    expect(raw.toNumber()).toBe(125);

    // 2 portions
    const raw2 = calculateRawQuantity(100, 80, 2);
    expect(raw2.toNumber()).toBe(250);
  });

  it("validates menus and aggregates raw needs", () => {
    const menuMap = new Map<string, MenuWithRecipes>([
      [
        "menu-1",
        {
          id: "menu-1",
          name: "Latte",
          sellingPrice: 20000,
          isActive: true,
          recipeItems: [
            {
              qtyUsableBase: 15,
              ingredient: {
                id: "kopi",
                name: "Kopi",
                yieldPercent: 100,
                isActive: true,
              },
            },
            {
              qtyUsableBase: 150,
              ingredient: {
                id: "susu",
                name: "Susu",
                yieldPercent: 100,
                isActive: true,
              },
            },
          ],
        },
      ],
    ]);

    const { rawNeedMap, ingredientNameMap } = validateAndAggregateRawNeeds(
      [{ menuId: "menu-1", qty: 2 }],
      menuMap
    );

    expect(rawNeedMap.get("kopi")?.toNumber()).toBe(30);
    expect(rawNeedMap.get("susu")?.toNumber()).toBe(300);
    expect(ingredientNameMap.get("kopi")).toBe("Kopi");
  });

  it("throws NotFoundError if menu is missing", () => {
    const menuMap = new Map<string, MenuWithRecipes>();
    expect(() => validateAndAggregateRawNeeds([{ menuId: "unknown", qty: 1 }], menuMap)).toThrow(
      NotFoundError
    );
  });

  it("throws ValidationError if menu is inactive or has no recipe", () => {
    const menuMap = new Map<string, MenuWithRecipes>([
      [
        "inactive",
        {
          id: "inactive",
          name: "Inactive Menu",
          sellingPrice: 10000,
          isActive: false,
          recipeItems: [],
        },
      ],
      [
        "no-recipe",
        {
          id: "no-recipe",
          name: "No Recipe Menu",
          sellingPrice: 10000,
          isActive: true,
          recipeItems: [],
        },
      ],
    ]);

    expect(() => validateAndAggregateRawNeeds([{ menuId: "inactive", qty: 1 }], menuMap)).toThrow(
      ValidationError
    );

    expect(() => validateAndAggregateRawNeeds([{ menuId: "no-recipe", qty: 1 }], menuMap)).toThrow(
      ValidationError
    );
  });

  it("allocates batches and computes totals and overhead", () => {
    const menuMap = new Map<string, MenuWithRecipes>([
      [
        "m1",
        {
          id: "m1",
          name: "Americano",
          sellingPrice: 25000,
          isActive: true,
          recipeItems: [
            {
              qtyUsableBase: 20,
              ingredient: {
                id: "kopi",
                name: "Kopi",
                yieldPercent: 100,
                isActive: true,
              },
            },
          ],
        },
      ],
    ]);

    const batchesMap = new Map([
      [
        "kopi",
        [
          {
            id: "b1",
            remainingQtyBase: new Decimal(100),
            costPerBase: new Decimal(200),
            expiryDate: new Date("2026-12-31"),
            receivedAt: new Date("2026-01-01"),
          },
        ],
      ],
    ]);

    const result = allocateSaleItemsFefo({
      items: [{ menuId: "m1", qty: 2 }],
      menuMap,
      batchesMap,
      ingredientNameMap: new Map([["kopi", "Kopi"]]),
      overheadPerPortion: 1200,
      referenceDate: new Date("2026-06-01"),
    });

    expect(result.totalAmount.toNumber()).toBe(50000);
    // 2 * 20g = 40g @ 200 = 8000
    expect(result.totalIngredientCost.toNumber()).toBe(8000);
    // 2 * 1200 = 2400
    expect(result.totalOverhead.toNumber()).toBe(2400);
    expect(result.preparedItems).toHaveLength(1);
  });

  it("throws InsufficientStockError when shortage occurs", () => {
    const menuMap = new Map<string, MenuWithRecipes>([
      [
        "m1",
        {
          id: "m1",
          name: "Americano",
          sellingPrice: 25000,
          isActive: true,
          recipeItems: [
            {
              qtyUsableBase: 100,
              ingredient: {
                id: "kopi",
                name: "Kopi",
                yieldPercent: 100,
                isActive: true,
              },
            },
          ],
        },
      ],
    ]);

    const batchesMap = new Map([
      [
        "kopi",
        [
          {
            id: "b1",
            remainingQtyBase: new Decimal(50), // Only 50g available, needs 100g
            costPerBase: new Decimal(200),
            expiryDate: new Date("2026-12-31"),
            receivedAt: new Date("2026-01-01"),
          },
        ],
      ],
    ]);

    expect(() =>
      allocateSaleItemsFefo({
        items: [{ menuId: "m1", qty: 1 }],
        menuMap,
        batchesMap,
        ingredientNameMap: new Map([["kopi", "Kopi"]]),
        overheadPerPortion: 500,
        referenceDate: new Date("2026-06-01"),
      })
    ).toThrow(InsufficientStockError);
  });
});
