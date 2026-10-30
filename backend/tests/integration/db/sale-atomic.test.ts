import {
  describeDb,
  createTestBusiness,
  createTestUser,
  cleanupBusinesses,
  disconnectDb,
} from "./helper.js";
import { it, expect, afterEach, afterAll } from "vitest";
import { SaleRepository } from "../../../src/repositories/sale.repo.js";
import { prisma } from "../../../src/lib/db.js";
import { Decimal } from "decimal.js";
import { BaseUnit, IngredientCategory } from "../../../src/generated/prisma/enums.js";
import { InsufficientStockError } from "../../../src/lib/errors.js";

describeDb("Real DB: Atomic POS Checkout & FEFO Stock Locking", () => {
  const saleRepo = new SaleRepository();
  const businessIds: string[] = [];

  afterEach(async () => {
    await cleanupBusinesses(businessIds);
    businessIds.length = 0;
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it("depletes batches in strict FEFO order, records movements, and handles idempotency", async () => {
    const business = await createTestBusiness("sale-atomic");
    businessIds.push(business.id);
    const cashier = await createTestUser(business.id, "CASHIER");

    // 1. Create ingredient
    const kopi = await prisma.ingredient.create({
      data: {
        businessId: business.id,
        name: "Biji Kopi House Blend",
        nameKey: "biji-kopi-house-blend",
        category: IngredientCategory.MAIN,
        baseUnit: BaseUnit.GRAM,
      },
    });

    // 2. Create 2 batches: batch Earlier (expiring in 5 days), batch Later (expiring in 30 days)
    const now = new Date();
    const batchEarlier = await prisma.stockBatch.create({
      data: {
        businessId: business.id,
        ingredientId: kopi.id,
        receivedAt: now,
        expiryDate: new Date(now.getTime() + 5 * 86400000), // +5 days
        purchaseQty: "100",
        purchaseUnit: "g",
        purchaseUnitPrice: "20000.00",
        initialQtyBase: "100",
        remainingQtyBase: "100", // 100g available
        costPerBase: "200.000000",
      },
    });

    const batchLater = await prisma.stockBatch.create({
      data: {
        businessId: business.id,
        ingredientId: kopi.id,
        receivedAt: now,
        expiryDate: new Date(now.getTime() + 30 * 86400000), // +30 days
        purchaseQty: "200",
        purchaseUnit: "g",
        purchaseUnitPrice: "50000.00",
        initialQtyBase: "200",
        remainingQtyBase: "200", // 200g available
        costPerBase: "250.000000",
      },
    });

    // 3. Create Menu with Recipe (1 portion = 150g kopi)
    const menu = await prisma.menu.create({
      data: {
        businessId: business.id,
        name: "Americano Double Shot",
        sellingPrice: "25000.00",
        isActive: true,
        recipe: {
          create: {
            businessId: business.id,
            ingredientId: kopi.id,
            amount: "150",
            unit: "g",
            yield: "1.000",
          },
        },
      },
    });

    // 4. Checkout 1 portion -> requires 150g kopi
    // Should take all 100g from batchEarlier, and 50g from batchLater
    const sale = await saleRepo.checkoutAtomic({
      businessId: business.id,
      cashierId: cashier.id,
      idempotencyKey: "idem-key-fefo-1",
      paymentMethod: "CASH",
      items: [{ menuId: menu.id, qty: 1 }],
      overheadPerPortion: new Decimal("1000.00"),
    });

    expect(sale.id).toBeDefined();
    expect(sale.invoiceNo).toMatch(/^INV-\d{8}-[A-Z0-9]{6}$/);

    // Verify batch remaining quantities
    const updatedEarlier = await prisma.stockBatch.findUniqueOrThrow({
      where: { id: batchEarlier.id },
    });
    const updatedLater = await prisma.stockBatch.findUniqueOrThrow({
      where: { id: batchLater.id },
    });

    expect(new Decimal(updatedEarlier.remainingQtyBase.toString()).toNumber()).toBe(0);
    expect(new Decimal(updatedLater.remainingQtyBase.toString()).toNumber()).toBe(150);

    // Verify stock movements
    const movements = await prisma.stockMovement.findMany({
      where: {
        businessId: business.id,
        refType: "SALE_ITEM",
        refId: { in: sale.items.map((i) => i.id) },
      },
      orderBy: { createdAt: "asc" },
    });
    expect(movements.length).toBe(2);
    expect(movements[0]?.batchId).toBe(batchEarlier.id);
    expect(new Decimal(movements[0]?.qtyBaseDelta.toString() ?? "0").toNumber()).toBe(-100);
    expect(movements[1]?.batchId).toBe(batchLater.id);
    expect(new Decimal(movements[1]?.qtyBaseDelta.toString() ?? "0").toNumber()).toBe(-50);

    // 5. Test idempotency: repeating the same idempotency key returns same sale, no new movements
    const repeatedSale = await saleRepo.checkoutAtomic({
      businessId: business.id,
      cashierId: cashier.id,
      idempotencyKey: "idem-key-fefo-1",
      paymentMethod: "CASH",
      items: [{ menuId: menu.id, qty: 1 }],
      overheadPerPortion: new Decimal("1000.00"),
    });

    expect(repeatedSale.id).toBe(sale.id);
    const movementCount = await prisma.stockMovement.count({
      where: {
        businessId: business.id,
        refType: "SALE_ITEM",
        refId: { in: sale.items.map((i) => i.id) },
      },
    });
    expect(movementCount).toBe(2);
  });

  it("rolls back completely when stock is insufficient and leaves batches intact", async () => {
    const business = await createTestBusiness("sale-shortage");
    businessIds.push(business.id);
    const cashier = await createTestUser(business.id, "CASHIER");

    const susu = await prisma.ingredient.create({
      data: {
        businessId: business.id,
        name: "Susu Segar",
        nameKey: "susu-segar",
        category: IngredientCategory.MAIN,
        baseUnit: BaseUnit.ML,
      },
    });

    const now = new Date();
    const batch = await prisma.stockBatch.create({
      data: {
        businessId: business.id,
        ingredientId: susu.id,
        receivedAt: now,
        expiryDate: new Date(now.getTime() + 10 * 86400000),
        purchaseQty: "100",
        purchaseUnit: "ml",
        purchaseUnitPrice: "5000.00",
        initialQtyBase: "100",
        remainingQtyBase: "100", // Only 100ml available
        costPerBase: "50.000000",
      },
    });

    const menu = await prisma.menu.create({
      data: {
        businessId: business.id,
        name: "Caffe Latte",
        sellingPrice: "20000.00",
        isActive: true,
        recipe: {
          create: {
            businessId: business.id,
            ingredientId: susu.id,
            amount: "200", // Needs 200ml per portion
            unit: "ml",
            yield: "1.000",
          },
        },
      },
    });

    // Attempt to checkout 1 portion (needs 200ml, only 100ml available)
    await expect(
      saleRepo.checkoutAtomic({
        businessId: business.id,
        cashierId: cashier.id,
        idempotencyKey: "idem-shortage",
        paymentMethod: "CASH",
        items: [{ menuId: menu.id, qty: 1 }],
        overheadPerPortion: new Decimal("500.00"),
      })
    ).rejects.toThrow(InsufficientStockError);

    // Verify stockBatch is untouched
    const batchAfter = await prisma.stockBatch.findUniqueOrThrow({
      where: { id: batch.id },
    });
    expect(new Decimal(batchAfter.remainingQtyBase.toString()).toNumber()).toBe(100);

    // Verify no sales or movements created
    const salesCount = await prisma.sale.count({ where: { businessId: business.id } });
    expect(salesCount).toBe(0);
  });
});
