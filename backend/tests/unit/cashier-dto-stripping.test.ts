import { describe, it, expect, vi, beforeEach } from "vitest";
import { InventoryService } from "../../src/services/inventory.service.js";
import { Decimal } from "decimal.js";
import type { InventoryRepository } from "../../src/repositories/inventory.repo.js";

describe("Rule 7: CASHIER DTO Stripping via Strict Allowlist", () => {
  let mockRepo: {
    findIngredientsWithBatches: ReturnType<typeof vi.fn>;
    findBatches: ReturnType<typeof vi.fn>;
  };
  let service: InventoryService;

  beforeEach(() => {
    mockRepo = {
      findIngredientsWithBatches: vi.fn(),
      findBatches: vi.fn(),
    };
    service = new InventoryService(mockRepo as unknown as InventoryRepository);
  });

  describe("getStockSummary DTO mapping", () => {
    const rawIngredientWithBatches = {
      id: "ing-1",
      name: "Biji Kopi Arabika",
      category: "MAIN",
      baseUnit: "G",
      minStockBase: new Decimal("500.000"),
      isActive: true,
      units: [],
      // Simulated extra or raw database fields
      confidentialSupplierMargin: "99.99%",
      secretPurchaseAgreement: "Exclusive pricing tier",
      stockBatches: [
        {
          id: "batch-1",
          remainingQtyBase: new Decimal("2000.000"),
          costPerBase: new Decimal("120.000000"),
          expiryDate: null,
          receivedAt: new Date("2026-10-20"),
          createdAt: new Date("2026-10-20"),
          purchase: {
            id: "purch-1",
            purchasedAt: new Date("2026-10-20"),
            createdAt: new Date("2026-10-20"),
          },
        },
      ],
    };

    it("strips cost fields for CASHIER role and only exposes allowlisted properties", async () => {
      mockRepo.findIngredientsWithBatches.mockResolvedValueOnce([rawIngredientWithBatches]);

      const summaries = await service.getStockSummary("biz-1", "CASHIER");

      expect(summaries.length).toBe(1);
      const summary = summaries[0]!;

      // 1. Cost fields must be undefined (not present or stripped)
      expect(summary.averageCostPerBase).toBeUndefined();
      expect(summary.latestCostPerBase).toBeUndefined();

      // 2. Extra unallowlisted properties must not leak
      expect((summary as Record<string, unknown>).confidentialSupplierMargin).toBeUndefined();
      expect((summary as Record<string, unknown>).secretPurchaseAgreement).toBeUndefined();

      // 3. Operational allowlisted fields must be present
      expect(summary.id).toBe("ing-1");
      expect(summary.name).toBe("Biji Kopi Arabika");
      expect(summary.category).toBe("MAIN");
      expect(summary.baseUnit).toBe("G");
      expect(summary.validStockBase).toBe("2000.000");
      expect(summary.status).toBe("AMAN");
      expect(summary.activeBatchCount).toBe(1);
    });

    it("includes cost fields for OWNER role", async () => {
      mockRepo.findIngredientsWithBatches.mockResolvedValueOnce([rawIngredientWithBatches]);

      const summaries = await service.getStockSummary("biz-1", "OWNER");

      expect(summaries.length).toBe(1);
      const summary = summaries[0]!;

      expect(summary.averageCostPerBase).toBe("120.000000");
      expect(summary.latestCostPerBase).toBe("120.000000");
    });
  });

  describe("getBatches DTO mapping", () => {
    const rawBatch = {
      id: "batch-susu-1",
      ingredientId: "ing-susu",
      purchaseId: "purch-100",
      receivedAt: new Date("2026-10-22T08:00:00Z"),
      expiryDate: new Date("2026-12-31T00:00:00Z"),
      purchaseQty: new Decimal("5.000"),
      purchaseUnit: "L",
      purchaseUnitPrice: new Decimal("18000.00"),
      initialQtyBase: new Decimal("5000.000"),
      remainingQtyBase: new Decimal("5000.000"),
      costPerBase: new Decimal("18.000000"),
      // Raw sensitive database fields
      internalProfitMargin: "45.5%",
      supplierBankDetail: "BCA 123456",
      ingredient: {
        id: "ing-susu",
        name: "Susu Segar",
        baseUnit: "ML",
        category: "MAIN",
      },
      purchase: {
        id: "purch-100",
        supplierName: "Peternakan Sejahtera",
        purchasedAt: new Date("2026-10-22"),
      },
    };

    it("strips costPerBase and purchaseUnitPrice for CASHIER using allowlist", async () => {
      mockRepo.findBatches.mockResolvedValueOnce([rawBatch]);

      const batches = await service.getBatches("biz-1", "CASHIER");

      expect(batches.length).toBe(1);
      const batch = batches[0]!;

      // 1. Cost fields must be omitted
      expect(batch.costPerBase).toBeUndefined();
      expect(batch.purchaseUnitPrice).toBeUndefined();

      // 2. Extra unallowlisted properties must not leak
      expect((batch as Record<string, unknown>).internalProfitMargin).toBeUndefined();
      expect((batch as Record<string, unknown>).supplierBankDetail).toBeUndefined();

      // 3. Allowlisted operational fields must be present
      expect(batch.id).toBe("batch-susu-1");
      expect(batch.ingredientName).toBe("Susu Segar");
      expect(batch.purchaseUnit).toBe("L");
      expect(batch.purchaseQty).toBe("5.000");
      expect(batch.remainingQtyBase).toBe("5000.000");
      expect(batch.status).toBe("AMAN");
      expect(batch.supplierName).toBe("Peternakan Sejahtera");
    });

    it("includes costPerBase and purchaseUnitPrice for OWNER role", async () => {
      mockRepo.findBatches.mockResolvedValueOnce([rawBatch]);

      const batches = await service.getBatches("biz-1", "OWNER");

      expect(batches.length).toBe(1);
      const batch = batches[0]!;

      expect(batch.costPerBase).toBe("18.000000");
      expect(batch.purchaseUnitPrice).toBe("18000.00");
    });
  });
});
