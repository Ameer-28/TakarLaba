import { describeDb, createTestBusiness, cleanupBusinesses, disconnectDb } from "./helper.js";
import { it, expect, afterEach, afterAll } from "vitest";
import { prisma } from "../../../src/lib/db.js";
import { BaseUnit, IngredientCategory } from "../../../src/generated/prisma/enums.js";

describeDb("Real DB: Check Constraints and Unique Constraints", () => {
  const businessIds: string[] = [];

  afterEach(async () => {
    await cleanupBusinesses(businessIds);
    businessIds.length = 0;
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it("violates stock_batch_qty_chk when remainingQtyBase exceeds initialQtyBase", async () => {
    const business = await createTestBusiness("constraint-chk-max");
    businessIds.push(business.id);

    const ingredient = await prisma.ingredient.create({
      data: {
        businessId: business.id,
        name: "Biji Kopi",
        nameKey: "biji-kopi",
        category: IngredientCategory.MAIN,
        baseUnit: BaseUnit.G,
      },
    });

    // Attempt to insert batch with remaining (1500) > initial (1000)
    await expect(
      prisma.stockBatch.create({
        data: {
          businessId: business.id,
          ingredientId: ingredient.id,
          purchaseQty: "1",
          purchaseUnit: "KG",
          purchaseUnitPrice: "100000.00",
          initialQtyBase: "1000",
          remainingQtyBase: "1500", // Violates remainingQtyBase <= initialQtyBase
          costPerBase: "100.000000",
        },
      })
    ).rejects.toThrow();
  });

  it("violates stock_batch_qty_chk when remainingQtyBase is negative", async () => {
    const business = await createTestBusiness("constraint-chk-neg");
    businessIds.push(business.id);

    const ingredient = await prisma.ingredient.create({
      data: {
        businessId: business.id,
        name: "Gula Pasir",
        nameKey: "gula-pasir",
        category: IngredientCategory.MAIN,
        baseUnit: BaseUnit.G,
      },
    });

    // Attempt to insert batch with negative remainingQtyBase (-10)
    await expect(
      prisma.stockBatch.create({
        data: {
          businessId: business.id,
          ingredientId: ingredient.id,
          purchaseQty: "1",
          purchaseUnit: "KG",
          purchaseUnitPrice: "18000.00",
          initialQtyBase: "1000",
          remainingQtyBase: "-10", // Violates remainingQtyBase >= 0
          costPerBase: "18.000000",
        },
      })
    ).rejects.toThrow();
  });

  it("violates stock_batch_qty_chk when initialQtyBase is zero or negative", async () => {
    const business = await createTestBusiness("constraint-chk-zero");
    businessIds.push(business.id);

    const ingredient = await prisma.ingredient.create({
      data: {
        businessId: business.id,
        name: "Sirup Vanila",
        nameKey: "sirup-vanila",
        category: IngredientCategory.MAIN,
        baseUnit: BaseUnit.ML,
      },
    });

    // Attempt to insert batch with initialQtyBase = 0
    await expect(
      prisma.stockBatch.create({
        data: {
          businessId: business.id,
          ingredientId: ingredient.id,
          purchaseQty: "0",
          purchaseUnit: "BTL",
          purchaseUnitPrice: "0.00",
          initialQtyBase: "0", // Violates initialQtyBase > 0
          remainingQtyBase: "0",
          costPerBase: "0.000000",
        },
      })
    ).rejects.toThrow();
  });

  it("enforces uniqueness of ingredient nameKey per business but permits same nameKey across businesses", async () => {
    const bizA = await createTestBusiness("uniq-biz-a");
    const bizB = await createTestBusiness("uniq-biz-b");
    businessIds.push(bizA.id, bizB.id);

    // 1. Create first ingredient in Biz A
    const ingA = await prisma.ingredient.create({
      data: {
        businessId: bizA.id,
        name: "Kopi Espresso Blend",
        nameKey: "kopi-espresso-blend",
        category: IngredientCategory.MAIN,
        baseUnit: BaseUnit.G,
      },
    });
    expect(ingA.id).toBeDefined();

    // 2. Duplicate in Biz A -> must fail unique constraint [businessId, nameKey]
    await expect(
      prisma.ingredient.create({
        data: {
          businessId: bizA.id,
          name: "Kopi Espresso Blend",
          nameKey: "kopi-espresso-blend",
          category: IngredientCategory.MAIN,
          baseUnit: BaseUnit.G,
        },
      })
    ).rejects.toThrow();

    // 3. Same nameKey in Biz B -> must succeed
    const ingB = await prisma.ingredient.create({
      data: {
        businessId: bizB.id,
        name: "Kopi Espresso Blend",
        nameKey: "kopi-espresso-blend",
        category: IngredientCategory.MAIN,
        baseUnit: BaseUnit.G,
      },
    });
    expect(ingB.id).toBeDefined();
    expect(ingB.businessId).toBe(bizB.id);
  });
});
