import { describe, it, expect, vi, beforeEach } from "vitest";
import { PurchaseRepository } from "../../src/repositories/purchase.repo.js";
import { Decimal } from "decimal.js";

// Mock prisma db
vi.mock("../../src/lib/db.js", () => {
  return {
    prisma: {
      $transaction: vi.fn(),
    },
  };
});

import { prisma } from "../../src/lib/db.js";

describe("PurchaseRepository.createAtomic - Transaction Rollback (T-023)", () => {
  let repository: PurchaseRepository;

  const mockTx = {
    purchase: {
      create: vi.fn(),
    },
    stockBatch: {
      create: vi.fn(),
    },
    stockMovement: {
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new PurchaseRepository();

    // Default transaction runner executes the callback with mockTx
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: unknown) => {
      if (typeof callback === "function") {
        return (callback as (tx: typeof mockTx) => Promise<unknown>)(mockTx);
      }
      return undefined;
    });
  });

  const samplePurchaseData = {
    businessId: "biz-test-1",
    createdById: "user-1",
    supplierName: "Supplier Makmur",
    note: "Belanja bahan",
    purchasedAt: new Date("2026-10-22T08:00:00Z"),
    totalAmount: new Decimal("150000.00"),
    batches: [
      {
        ingredientId: "ing-1",
        expiryDate: null,
        purchaseQty: new Decimal("2"),
        purchaseUnit: "kg",
        purchaseUnitPrice: new Decimal("50000"),
        initialQtyBase: new Decimal("2000"),
        costPerBase: new Decimal("25"),
      },
      {
        ingredientId: "ing-2",
        expiryDate: new Date("2026-11-01"),
        purchaseQty: new Decimal("5"),
        purchaseUnit: "liter",
        purchaseUnitPrice: new Decimal("10000"),
        initialQtyBase: new Decimal("5000"),
        costPerBase: new Decimal("10"),
      },
    ],
  };

  it("completes full atomic transaction when all records are created successfully", async () => {
    mockTx.purchase.create.mockResolvedValueOnce({
      id: "purch-123",
      businessId: "biz-test-1",
      supplierName: "Supplier Makmur",
      note: "Belanja bahan",
      purchasedAt: samplePurchaseData.purchasedAt,
      totalAmount: "150000.00",
      createdById: "user-1",
      createdAt: new Date(),
    });

    mockTx.stockBatch.create
      .mockResolvedValueOnce({
        id: "batch-1",
        ingredientId: "ing-1",
        purchaseId: "purch-123",
        remainingQtyBase: "2000.000",
        ingredient: { id: "ing-1", name: "Beras", baseUnit: "G", category: "MAIN" },
      })
      .mockResolvedValueOnce({
        id: "batch-2",
        ingredientId: "ing-2",
        purchaseId: "purch-123",
        remainingQtyBase: "5000.000",
        ingredient: { id: "ing-2", name: "Minyak", baseUnit: "ML", category: "MAIN" },
      });

    mockTx.stockMovement.create
      .mockResolvedValueOnce({ id: "mov-1" })
      .mockResolvedValueOnce({ id: "mov-2" });

    const result = await repository.createAtomic(samplePurchaseData);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.purchase.create).toHaveBeenCalledTimes(1);
    expect(mockTx.stockBatch.create).toHaveBeenCalledTimes(2);
    expect(mockTx.stockMovement.create).toHaveBeenCalledTimes(2);
    expect(result.id).toBe("purch-123");
    expect(result.batches).toHaveLength(2);
  });

  it("rolls back and propagates error when creating a batch fails halfway", async () => {
    // 1. Purchase header succeeds
    mockTx.purchase.create.mockResolvedValueOnce({
      id: "purch-123",
      businessId: "biz-test-1",
      totalAmount: "150000.00",
    });

    // 2. Batch 1 succeeds
    mockTx.stockBatch.create.mockResolvedValueOnce({
      id: "batch-1",
      ingredientId: "ing-1",
      purchaseId: "purch-123",
    });
    mockTx.stockMovement.create.mockResolvedValueOnce({ id: "mov-1" });

    // 3. Batch 2 fails with database error (e.g. constraint violation or connection loss)
    const dbError = new Error("Database error: could not insert batch 2 due to disk I/O error");
    mockTx.stockBatch.create.mockRejectedValueOnce(dbError);

    // Act & Assert
    await expect(repository.createAtomic(samplePurchaseData)).rejects.toThrow(
      "Database error: could not insert batch 2 due to disk I/O error"
    );

    // Verify stockMovement for batch 2 was NEVER called
    expect(mockTx.stockMovement.create).toHaveBeenCalledTimes(1);
  });

  it("rolls back and propagates error when stockMovement creation fails", async () => {
    mockTx.purchase.create.mockResolvedValueOnce({
      id: "purch-123",
      businessId: "biz-test-1",
      totalAmount: "150000.00",
    });

    mockTx.stockBatch.create.mockResolvedValueOnce({
      id: "batch-1",
      ingredientId: "ing-1",
      purchaseId: "purch-123",
    });

    // stockMovement fails
    const movementError = new Error("Foreign key constraint violation on StockMovement");
    mockTx.stockMovement.create.mockRejectedValueOnce(movementError);

    await expect(repository.createAtomic(samplePurchaseData)).rejects.toThrow(
      "Foreign key constraint violation on StockMovement"
    );

    // Batch 2 creation should never be reached
    expect(mockTx.stockBatch.create).toHaveBeenCalledTimes(1);
  });

  it("rolls back when purchase header creation fails", async () => {
    const headerError = new Error("Failed to insert purchase header");
    mockTx.purchase.create.mockRejectedValueOnce(headerError);

    await expect(repository.createAtomic(samplePurchaseData)).rejects.toThrow(
      "Failed to insert purchase header"
    );

    // No batches or movements should ever be created
    expect(mockTx.stockBatch.create).not.toHaveBeenCalled();
    expect(mockTx.stockMovement.create).not.toHaveBeenCalled();
  });
});
