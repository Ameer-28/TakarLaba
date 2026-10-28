import {
  describeDb,
  createTestBusiness,
  createTestUser,
  cleanupBusinesses,
  disconnectDb,
} from "./helper.js";
import { it, expect, afterEach, afterAll } from "vitest";
import { PurchaseRepository } from "../../../src/repositories/purchase.repo.js";
import { InventoryService } from "../../../src/services/inventory.service.js";
import { inventoryRepository } from "../../../src/repositories/inventory.repo.js";
import { prisma } from "../../../src/lib/db.js";
import { Decimal } from "decimal.js";
import { BaseUnit, IngredientCategory } from "../../../src/generated/prisma/enums.js";

describeDb("Real DB: BR-03 Replacement Cost on Reverse Expiry Order", () => {
  const purchaseRepo = new PurchaseRepository();
  const inventoryService = new InventoryService(inventoryRepository);
  const businessIds: string[] = [];

  afterEach(async () => {
    await cleanupBusinesses(businessIds);
    businessIds.length = 0;
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it("selects replacement cost from the purchase with latest purchasedAt even when expiry order is reversed", async () => {
    const business = await createTestBusiness("br03");
    businessIds.push(business.id);
    const user = await createTestUser(business.id);

    // 1. Create ingredient
    const ingredient = await prisma.ingredient.create({
      data: {
        businessId: business.id,
        name: "Susu Segar Murni",
        nameKey: "susu-segar-murni",
        category: IngredientCategory.MAIN,
        baseUnit: BaseUnit.ML,
      },
    });

    // 2. Older purchase (Oct 10): price 15.000000, expires LATER (Nov 30)
    await purchaseRepo.createAtomic({
      businessId: business.id,
      createdById: user.id,
      supplierName: "Supplier Susu A",
      purchasedAt: new Date("2026-10-10T08:00:00Z"),
      totalAmount: new Decimal("75000.00"),
      batches: [
        {
          ingredientId: ingredient.id,
          expiryDate: new Date("2026-11-30T00:00:00Z"),
          purchaseQty: new Decimal("5"),
          purchaseUnit: "L",
          purchaseUnitPrice: new Decimal("15000.00"),
          initialQtyBase: new Decimal("5000"),
          costPerBase: new Decimal("15.000000"),
        },
      ],
    });

    // 3. Newer purchase (Oct 20): price 18.000000, expires EARLIER (Oct 25) -> reverse expiry!
    await purchaseRepo.createAtomic({
      businessId: business.id,
      createdById: user.id,
      supplierName: "Supplier Susu B",
      purchasedAt: new Date("2026-10-20T08:00:00Z"),
      totalAmount: new Decimal("54000.00"),
      batches: [
        {
          ingredientId: ingredient.id,
          expiryDate: new Date("2026-10-25T00:00:00Z"),
          purchaseQty: new Decimal("3"),
          purchaseUnit: "L",
          purchaseUnitPrice: new Decimal("18000.00"),
          initialQtyBase: new Decimal("3000"),
          costPerBase: new Decimal("18.000000"),
        },
      ],
    });

    // 4. Retrieve stock summary as OWNER
    const summaries = await inventoryService.getStockSummary(business.id, "OWNER");

    const ingSummary = summaries.find((s) => s.id === ingredient.id);
    expect(ingSummary).toBeDefined();

    // In FEFO order, the batch expiring Oct 25 appears first, and the batch expiring Nov 30 appears second.
    // Under BR-03, replacement cost must be 18.000000 (from Oct 20 purchase), NOT 15.000000 (from Oct 10).
    expect(ingSummary?.latestCostPerBase).toBe("18.000000");
  });
});
