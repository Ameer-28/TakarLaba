import {
  describeDb,
  createTestBusiness,
  createTestUser,
  cleanupBusinesses,
  disconnectDb,
} from "./helper.js";
import { it, expect, afterEach, afterAll } from "vitest";
import { PurchaseRepository } from "../../../src/repositories/purchase.repo.js";
import { prisma } from "../../../src/lib/db.js";
import { Decimal } from "decimal.js";
import { BaseUnit, IngredientCategory } from "../../../src/generated/prisma/enums.js";

describeDb("Real DB: Atomic Multi-Row Purchase Rollback", () => {
  const purchaseRepo = new PurchaseRepository();
  const businessIds: string[] = [];

  afterEach(async () => {
    await cleanupBusinesses(businessIds);
    businessIds.length = 0;
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it("rolls back purchase, stock batches, and stock movements when a second row fails", async () => {
    const business = await createTestBusiness("atomic");
    businessIds.push(business.id);
    const user = await createTestUser(business.id);

    // Create 1 valid ingredient
    const validIngredient = await prisma.ingredient.create({
      data: {
        businessId: business.id,
        name: "Susu Segar",
        nameKey: "susu-segar",
        category: IngredientCategory.MAIN,
        baseUnit: BaseUnit.ML,
      },
    });

    const purchaseCountBefore = await prisma.purchase.count({
      where: { businessId: business.id },
    });
    const batchCountBefore = await prisma.stockBatch.count({
      where: { businessId: business.id },
    });
    const movementCountBefore = await prisma.stockMovement.count({
      where: { businessId: business.id },
    });

    // Attempt multi-row purchase where 2nd line references non-existent ingredient
    await expect(
      purchaseRepo.createAtomic({
        businessId: business.id,
        createdById: user.id,
        supplierName: "Supplier Makmur",
        note: "Tes rollback atomik",
        purchasedAt: new Date("2026-10-22T08:00:00Z"),
        totalAmount: new Decimal("100000.00"),
        batches: [
          {
            ingredientId: validIngredient.id,
            expiryDate: new Date("2026-11-01"),
            purchaseQty: new Decimal("5"),
            purchaseUnit: "L",
            purchaseUnitPrice: new Decimal("15000.00"),
            initialQtyBase: new Decimal("5000"),
            costPerBase: new Decimal("15.000000"),
          },
          {
            ingredientId: "non-existent-ingredient-cuid",
            expiryDate: null,
            purchaseQty: new Decimal("1"),
            purchaseUnit: "KG",
            purchaseUnitPrice: new Decimal("25000.00"),
            initialQtyBase: new Decimal("1000"),
            costPerBase: new Decimal("25.000000"),
          },
        ],
      })
    ).rejects.toThrow();

    const purchaseCountAfter = await prisma.purchase.count({
      where: { businessId: business.id },
    });
    const batchCountAfter = await prisma.stockBatch.count({
      where: { businessId: business.id },
    });
    const movementCountAfter = await prisma.stockMovement.count({
      where: { businessId: business.id },
    });

    expect(purchaseCountAfter).toBe(purchaseCountBefore);
    expect(batchCountAfter).toBe(batchCountBefore);
    expect(movementCountAfter).toBe(movementCountBefore);
  });
});
