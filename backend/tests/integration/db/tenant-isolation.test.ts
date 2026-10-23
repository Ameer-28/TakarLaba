import {
  describeDb,
  createTestBusiness,
  createTestUser,
  cleanupBusinesses,
  disconnectDb,
} from "./helper.js";
import { it, expect, afterEach, afterAll } from "vitest";
import { IngredientRepository } from "../../../src/repositories/ingredient.repo.js";
import { PurchaseRepository } from "../../../src/repositories/purchase.repo.js";
import { InventoryRepository } from "../../../src/repositories/inventory.repo.js";
import { prisma } from "../../../src/lib/db.js";
import { Decimal } from "decimal.js";
import { BaseUnit, IngredientCategory } from "../../../src/generated/prisma/enums.js";

describeDb("Real DB: Tenant Isolation Across Entities", () => {
  const ingredientRepo = new IngredientRepository();
  const purchaseRepo = new PurchaseRepository();
  const inventoryRepo = new InventoryRepository();
  const businessIds: string[] = [];

  afterEach(async () => {
    await cleanupBusinesses(businessIds);
    businessIds.length = 0;
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it("enforces strict isolation between two businesses for ingredients, purchases, stock batches, and summaries", async () => {
    // 1. Create two separate businesses
    const bizA = await createTestBusiness("tenant-a");
    const bizB = await createTestBusiness("tenant-b");
    businessIds.push(bizA.id, bizB.id);

    const userA = await createTestUser(bizA.id);
    const userB = await createTestUser(bizB.id);

    // 2. Create ingredient for Business A and Business B
    const ingredientA = await prisma.ingredient.create({
      data: {
        businessId: bizA.id,
        name: "Kopi Arabika Gayo",
        nameKey: "kopi-arabika-gayo",
        category: IngredientCategory.MAIN,
        baseUnit: BaseUnit.G,
      },
    });

    const ingredientB = await prisma.ingredient.create({
      data: {
        businessId: bizB.id,
        name: "Teh Melati Premium",
        nameKey: "teh-melati-premium",
        category: IngredientCategory.MAIN,
        baseUnit: BaseUnit.G,
      },
    });

    // 3. Create purchases for both businesses
    const purchaseA = await purchaseRepo.createAtomic({
      businessId: bizA.id,
      createdById: userA.id,
      supplierName: "Supplier Kopi A",
      purchasedAt: new Date("2026-10-20T10:00:00Z"),
      totalAmount: new Decimal("50000.00"),
      batches: [
        {
          ingredientId: ingredientA.id,
          expiryDate: new Date("2026-12-31"),
          purchaseQty: new Decimal("1"),
          purchaseUnit: "KG",
          purchaseUnitPrice: new Decimal("50000.00"),
          initialQtyBase: new Decimal("1000"),
          costPerBase: new Decimal("50.000000"),
        },
      ],
    });

    const purchaseB = await purchaseRepo.createAtomic({
      businessId: bizB.id,
      createdById: userB.id,
      supplierName: "Supplier Teh B",
      purchasedAt: new Date("2026-10-21T10:00:00Z"),
      totalAmount: new Decimal("30000.00"),
      batches: [
        {
          ingredientId: ingredientB.id,
          expiryDate: new Date("2026-11-30"),
          purchaseQty: new Decimal("1"),
          purchaseUnit: "KG",
          purchaseUnitPrice: new Decimal("30000.00"),
          initialQtyBase: new Decimal("1000"),
          costPerBase: new Decimal("30.000000"),
        },
      ],
    });

    // --- Ingredient Isolation Checks ---
    const ingredientAFromBizB = await ingredientRepo.findById(bizB.id, ingredientA.id);
    expect(ingredientAFromBizB).toBeNull();

    const ingredientBFromBizA = await ingredientRepo.findById(bizA.id, ingredientB.id);
    expect(ingredientBFromBizA).toBeNull();

    const listIngredientsA = await ingredientRepo.findMany(bizA.id);
    expect(listIngredientsA.some((ing) => ing.id === ingredientB.id)).toBe(false);
    expect(listIngredientsA.some((ing) => ing.id === ingredientA.id)).toBe(true);

    // --- Purchase Isolation Checks ---
    const purchaseAFromBizB = await purchaseRepo.findById(bizB.id, purchaseA.id);
    expect(purchaseAFromBizB).toBeNull();

    const purchaseBFromBizA = await purchaseRepo.findById(bizA.id, purchaseB.id);
    expect(purchaseBFromBizA).toBeNull();

    const listPurchasesA = await purchaseRepo.findMany(bizA.id);
    expect(listPurchasesA.purchases.some((p) => p.id === purchaseB.id)).toBe(false);
    expect(listPurchasesA.purchases.some((p) => p.id === purchaseA.id)).toBe(true);

    // --- Batch & Summary Isolation Checks ---
    const batchesBizA = await inventoryRepo.findBatches(bizA.id);
    expect(batchesBizA.every((b) => b.businessId === bizA.id)).toBe(true);
    expect(batchesBizA.some((b) => b.ingredientId === ingredientB.id)).toBe(false);

    const ingredientsWithBatchesA = await inventoryRepo.findIngredientsWithBatches(bizA.id);
    expect(ingredientsWithBatchesA.every((item) => item.businessId === bizA.id)).toBe(true);
    expect(ingredientsWithBatchesA.some((item) => item.id === ingredientB.id)).toBe(false);
  });
});
