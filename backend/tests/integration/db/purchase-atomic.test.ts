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

  it("voidPurchaseAtomic reverses unused batch stock and adds compensating ADJUSTMENT movement", async () => {
    const business = await createTestBusiness("void-purch");
    businessIds.push(business.id);
    const user = await createTestUser(business.id);

    const ingredient = await prisma.ingredient.create({
      data: {
        businessId: business.id,
        name: "Biji Kopi Arabika",
        nameKey: "biji-kopi-arabika",
        category: IngredientCategory.MAIN,
        baseUnit: BaseUnit.G,
      },
    });

    const purchase = await purchaseRepo.createAtomic({
      businessId: business.id,
      createdById: user.id,
      supplierName: "Toko Kopi",
      note: "Pembelian awal",
      purchasedAt: new Date(),
      totalAmount: new Decimal("180000.00"),
      batches: [
        {
          ingredientId: ingredient.id,
          expiryDate: new Date("2026-12-01"),
          purchaseQty: new Decimal("1"),
          purchaseUnit: "KG",
          purchaseUnitPrice: new Decimal("180000.00"),
          initialQtyBase: new Decimal("1000"),
          costPerBase: new Decimal("180.000000"),
        },
      ],
    });

    // Void the purchase
    const voided = await purchaseRepo.voidPurchaseAtomic(
      business.id,
      user.id,
      purchase.id,
      "Salah input nota belanja"
    );

    expect(voided.note).toContain("[DIBATALKAN: Salah input nota belanja]");

    // Verify batch remaining stock is now 0
    const updatedBatch = await prisma.stockBatch.findUnique({
      where: { id: voided.batches[0]!.id },
    });
    expect(new Decimal(updatedBatch!.remainingQtyBase.toString()).toNumber()).toBe(0);

    // Verify compensating ADJUSTMENT movement was created
    const adjMovement = await prisma.stockMovement.findFirst({
      where: {
        businessId: business.id,
        refType: "PURCHASE_VOID",
        refId: purchase.id,
      },
    });
    expect(adjMovement).not.toBeNull();
    expect(adjMovement!.type).toBe("ADJUSTMENT");
    expect(new Decimal(adjMovement!.qtyBaseDelta.toString()).toNumber()).toBe(-1000);

    // Attempting to void again should throw ConflictError
    await expect(
      purchaseRepo.voidPurchaseAtomic(business.id, user.id, purchase.id, "Coba void lagi")
    ).rejects.toThrow("sudah dibatalkan");
  });

  it("voidPurchaseAtomic throws ConflictError when any batch stock has been used", async () => {
    const business = await createTestBusiness("void-fail");
    businessIds.push(business.id);
    const user = await createTestUser(business.id);

    const ingredient = await prisma.ingredient.create({
      data: {
        businessId: business.id,
        name: "Susu UHT",
        nameKey: "susu-uht",
        category: IngredientCategory.MAIN,
        baseUnit: BaseUnit.ML,
      },
    });

    const purchase = await purchaseRepo.createAtomic({
      businessId: business.id,
      createdById: user.id,
      supplierName: "Distributor Susu",
      purchasedAt: new Date(),
      totalAmount: new Decimal("50000.00"),
      batches: [
        {
          ingredientId: ingredient.id,
          expiryDate: new Date("2026-11-20"),
          purchaseQty: new Decimal("2"),
          purchaseUnit: "L",
          purchaseUnitPrice: new Decimal("25000.00"),
          initialQtyBase: new Decimal("2000"),
          costPerBase: new Decimal("25.000000"),
        },
      ],
    });

    const batchId = purchase.batches[0]!.id;

    // Simulate batch usage (e.g. 500 ml consumed in sales or waste)
    await prisma.stockBatch.update({
      where: { id: batchId },
      data: { remainingQtyBase: "1500.000" },
    });

    await expect(
      purchaseRepo.voidPurchaseAtomic(
        business.id,
        user.id,
        purchase.id,
        "Batalkan karena salah supplier"
      )
    ).rejects.toThrow("sudah terpakai");
  });
});
