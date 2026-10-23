import { describeDb, createTestBusiness, cleanupBusinesses, disconnectDb } from "./helper.js";
import { it, expect, afterEach, afterAll } from "vitest";
import { InventoryRepository } from "../../../src/repositories/inventory.repo.js";
import { prisma } from "../../../src/lib/db.js";
import { BaseUnit, IngredientCategory } from "../../../src/generated/prisma/enums.js";

describeDb("Real DB: FEFO (First Expired First Out) Ordering", () => {
  const inventoryRepo = new InventoryRepository();
  const businessIds: string[] = [];

  afterEach(async () => {
    await cleanupBusinesses(businessIds);
    businessIds.length = 0;
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it("returns batches sorted strictly by expiryDate ascending with nulls placed last", async () => {
    const business = await createTestBusiness("fefo");
    businessIds.push(business.id);

    const ingredient = await prisma.ingredient.create({
      data: {
        businessId: business.id,
        name: "Susu Segar Pasteurisasi",
        nameKey: "susu-segar-pasteurisasi",
        category: IngredientCategory.MAIN,
        baseUnit: BaseUnit.ML,
      },
    });

    // 1. Batch expiring in mid-November, received early October
    const batchLaterExpiry = await prisma.stockBatch.create({
      data: {
        businessId: business.id,
        ingredientId: ingredient.id,
        receivedAt: new Date("2026-10-01T08:00:00Z"),
        expiryDate: new Date("2026-11-20T00:00:00Z"),
        purchaseQty: "5",
        purchaseUnit: "L",
        purchaseUnitPrice: "15000.00",
        initialQtyBase: "5000",
        remainingQtyBase: "5000",
        costPerBase: "15.000000",
      },
    });

    // 2. Batch expiring earlier in late October, received later
    const batchEarlierExpiry = await prisma.stockBatch.create({
      data: {
        businessId: business.id,
        ingredientId: ingredient.id,
        receivedAt: new Date("2026-10-05T08:00:00Z"),
        expiryDate: new Date("2026-10-25T00:00:00Z"),
        purchaseQty: "3",
        purchaseUnit: "L",
        purchaseUnitPrice: "16000.00",
        initialQtyBase: "3000",
        remainingQtyBase: "3000",
        costPerBase: "16.000000",
      },
    });

    // 3. Batch with no expiry date (non-perishable item or unknown), received earliest
    const batchNoExpiry = await prisma.stockBatch.create({
      data: {
        businessId: business.id,
        ingredientId: ingredient.id,
        receivedAt: new Date("2026-09-01T08:00:00Z"),
        expiryDate: null,
        purchaseQty: "10",
        purchaseUnit: "L",
        purchaseUnitPrice: "14000.00",
        initialQtyBase: "10000",
        remainingQtyBase: "10000",
        costPerBase: "14.000000",
      },
    });

    const batches = await inventoryRepo.findBatches(business.id, {
      ingredientId: ingredient.id,
    });

    expect(batches.length).toBe(3);
    // FEFO order:
    // 1. Earliest expiry (2026-10-25)
    expect(batches[0]?.id).toBe(batchEarlierExpiry.id);
    // 2. Later expiry (2026-11-20)
    expect(batches[1]?.id).toBe(batchLaterExpiry.id);
    // 3. Null expiry last
    expect(batches[2]?.id).toBe(batchNoExpiry.id);
  });
});
