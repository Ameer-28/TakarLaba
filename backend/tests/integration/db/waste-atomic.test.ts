import {
  describeDb,
  createTestBusiness,
  createTestUser,
  cleanupBusinesses,
  disconnectDb,
  createTestIngredient,
  createTestBatch,
} from "./helper.js";
import { it, expect, afterEach, afterAll } from "vitest";
import { InventoryRepository } from "../../../src/repositories/inventory.repo.js";
import { prisma } from "../../../src/lib/db.js";
import { Decimal } from "decimal.js";
import { BaseUnit, IngredientCategory } from "../../../src/generated/prisma/enums.js";

describeDb("Real DB: Atomic Stock Waste Recording & Loss Calculation", () => {
  const inventoryRepo = new InventoryRepository();
  const businessIds: string[] = [];

  afterEach(async () => {
    await cleanupBusinesses(businessIds);
    businessIds.length = 0;
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it("atomically decrements batch stock, creates WASTE movement, and calculates financial loss", async () => {
    const business = await createTestBusiness("waste-atomic");
    businessIds.push(business.id);
    const owner = await createTestUser(business.id, "OWNER");

    const kopi = await createTestIngredient({
      businessId: business.id,
      name: "Biji Kopi Robusta",
      category: IngredientCategory.MAIN,
      baseUnit: BaseUnit.G,
      yieldPercent: 100,
    });

    const batch = await createTestBatch({
      businessId: business.id,
      ingredientId: kopi.id,
      receivedAt: new Date(),
      expiryDate: new Date(Date.now() + 86400000 * 5),
      initialQtyBase: 500,
      remainingQtyBase: 500,
      costPerBase: "180.000000",
      purchaseUnit: "g",
      purchaseQty: 500,
      purchaseUnitPrice: "90000.00",
    });

    // 1. Record waste of 200g
    const result = await inventoryRepo.recordWasteAtomic({
      businessId: business.id,
      userId: owner.id,
      batchId: batch.id,
      qtyBase: new Decimal(200),
      reason: "Biji kopi berjamur karena lembap",
    });

    expect(Number(result.batch.remainingQtyBase)).toBe(300);
    expect(Number(result.wastedValue)).toBe(36000); // 200 * 180 = 36.000
    expect(result.movement.type).toBe("WASTE");
    expect(Number(result.movement.qtyBaseDelta)).toBe(-200);
    expect(result.movement.note).toBe("Biji kopi berjamur karena lembap");

    // Verify DB records
    const batchInDb = await prisma.stockBatch.findUniqueOrThrow({
      where: { id: batch.id },
    });
    expect(Number(batchInDb.remainingQtyBase)).toBe(300);

    const movementInDb = await prisma.stockMovement.findFirst({
      where: {
        businessId: business.id,
        batchId: batch.id,
        type: "WASTE",
      },
    });
    expect(movementInDb).toBeDefined();
    expect(Number(movementInDb?.qtyBaseDelta)).toBe(-200);
    expect(movementInDb?.note).toBe("Biji kopi berjamur karena lembap");

    // 2. Reject waste exceeding remaining quantity (350g > 300g)
    await expect(
      inventoryRepo.recordWasteAtomic({
        businessId: business.id,
        userId: owner.id,
        batchId: batch.id,
        qtyBase: new Decimal(350),
        reason: "Coba buang melebihi sisa",
      })
    ).rejects.toThrow("melebihi sisa stok batch");

    // Verify stock in DB still unchanged at 300g
    const batchAfterFailed = await prisma.stockBatch.findUniqueOrThrow({
      where: { id: batch.id },
    });
    expect(Number(batchAfterFailed.remainingQtyBase)).toBe(300);
  });
});
