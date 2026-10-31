import { describe, it, expect, vi, beforeEach } from "vitest";
import { InventoryService } from "../../src/services/inventory.service.js";
import { saleService } from "../../src/services/sale.service.js";
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

  describe("saleService.mapToDto with batch allocations", () => {
    const rawSale = {
      id: "sale-confidential-1",
      invoiceNo: "INV-20261029-CONF01",
      idempotencyKey: "idem-conf-1",
      soldAt: new Date("2026-10-29T10:00:00.000Z"),
      cashierId: "cashier-1",
      cashier: {
        id: "cashier-1",
        name: "Kasir Test",
        role: "CASHIER",
      },
      paymentMethod: "CASH",
      totalAmount: new Decimal("20000.00"),
      totalIngredientCost: new Decimal("8000.00"),
      totalOverhead: new Decimal("2000.00"),
      status: "COMPLETED",
      items: [
        {
          id: "item-1",
          saleId: "sale-confidential-1",
          menuId: "menu-1",
          menuNameSnapshot: "Kopi Gula Aren",
          qty: 1,
          unitPrice: new Decimal("20000.00"),
          ingredientCostActual: new Decimal("8000.00"),
          overheadAllocated: new Decimal("2000.00"),
        },
      ],
      movements: [
        {
          id: "mov-1",
          ingredientId: "ing-1",
          batchId: "batch-1",
          qtyBaseDelta: new Decimal("-15.000"),
          costPerBase: new Decimal("250.000000"),
          refType: "SALE_ITEM",
          refId: "item-1",
          ingredient: {
            id: "ing-1",
            name: "Biji Kopi",
            baseUnit: "GRAM",
          },
          batch: {
            id: "batch-1",
            expiryDate: new Date("2026-11-01T00:00:00.000Z"),
            purchaseUnit: "kg",
            purchaseUnitPrice: new Decimal("250000.00"),
            costPerBase: new Decimal("250.000000"),
          },
        },
      ],
    };

    it("strips cost fields, margins, and batch unit costs for CASHIER role", () => {
      const dto = saleService.mapToDto(rawSale, "CASHIER");

      // Sale level
      expect(dto.id).toBe("sale-confidential-1");
      expect(dto.totalAmount).toBe("20000.00");
      expect((dto as Record<string, unknown>).totalIngredientCost).toBeUndefined();
      expect((dto as Record<string, unknown>).totalOverhead).toBeUndefined();
      expect((dto as Record<string, unknown>).grossMargin).toBeUndefined();
      expect((dto as Record<string, unknown>).marginPercentage).toBeUndefined();

      // Item level
      expect(dto.items.length).toBe(1);
      const item = dto.items[0]!;
      expect(item.subtotalPrice).toBe("20000.00");
      expect((item as Record<string, unknown>).ingredientCostActual).toBeUndefined();
      expect((item as Record<string, unknown>).overheadAllocated).toBeUndefined();
      expect((item as Record<string, unknown>).grossMargin).toBeUndefined();

      // Batch allocation level
      expect(item.batchAllocations).toBeDefined();
      expect(item.batchAllocations!.length).toBe(1);
      const alloc = item.batchAllocations![0]!;
      expect(alloc.ingredientName).toBe("Biji Kopi");
      expect(alloc.qtyDeducted).toBe("15.000");
      expect((alloc as Record<string, unknown>).costPerBase).toBeUndefined();
      expect((alloc as Record<string, unknown>).subtotalCost).toBeUndefined();
    });

    it("includes cost fields, margins, and batch unit costs for OWNER role", () => {
      const dto = saleService.mapToDto(rawSale, "OWNER");

      // Sale level
      expect(dto.id).toBe("sale-confidential-1");
      expect(dto.totalAmount).toBe("20000.00");
      expect(dto.totalIngredientCost).toBe("8000.00");
      expect(dto.totalOverhead).toBe("2000.00");
      expect(dto.grossMargin).toBe("10000.00");
      expect(dto.marginPercentage).toBe("50.00");

      // Item level
      const item = dto.items[0]!;
      expect(item.ingredientCostActual).toBe("8000.00");
      expect(item.overheadAllocated).toBe("2000.00");
      expect(item.grossMargin).toBe("10000.00");
      expect(item.marginPercentage).toBe("50.00");

      // Batch allocation level
      const alloc = item.batchAllocations![0]!;
      expect(alloc.costPerBase).toBe("250.000000");
      expect(alloc.subtotalCost).toBe("3750.00");
    });
  });
});
