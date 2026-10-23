import { describe, it, expect, vi, beforeEach } from "vitest";
import { InventoryService } from "../../src/services/inventory.service.js";
import { Decimal } from "decimal.js";
import type { InventoryRepository } from "../../src/repositories/inventory.repo.js";

describe("BR-03: Replacement Cost (Unit Test)", () => {
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

  it("selects costPerBase from the purchase with latest purchasedAt, ignoring FEFO expiry order", async () => {
    // Two batches in FEFO order (Batch 2 expires earlier on Oct 25, so it appears first):
    // Batch 2: Purchased Oct 20 (NEWER), costPerBase = 2500, expiry Oct 25
    // Batch 1: Purchased Oct 10 (OLDER), costPerBase = 1000, expiry Nov 30
    const mockIngredient = {
      id: "ing-coffee",
      name: "Biji Kopi",
      category: "MAIN",
      baseUnit: "G",
      minStockBase: new Decimal("500"),
      isActive: true,
      units: [],
      stockBatches: [
        {
          id: "batch-2",
          remainingQtyBase: new Decimal("1000"),
          costPerBase: new Decimal("2500.000000"),
          expiryDate: new Date("2026-10-25T00:00:00Z"),
          receivedAt: new Date("2026-10-20T10:00:00Z"),
          createdAt: new Date("2026-10-20T10:00:00Z"),
          purchase: {
            id: "purch-2",
            purchasedAt: new Date("2026-10-20T08:00:00Z"),
            createdAt: new Date("2026-10-20T08:00:00Z"),
          },
        },
        {
          id: "batch-1",
          remainingQtyBase: new Decimal("1000"),
          costPerBase: new Decimal("1000.000000"),
          expiryDate: new Date("2026-11-30T00:00:00Z"),
          receivedAt: new Date("2026-10-10T10:00:00Z"),
          createdAt: new Date("2026-10-10T10:00:00Z"),
          purchase: {
            id: "purch-1",
            purchasedAt: new Date("2026-10-10T08:00:00Z"),
            createdAt: new Date("2026-10-10T08:00:00Z"),
          },
        },
      ],
    };

    mockRepo.findIngredientsWithBatches.mockResolvedValueOnce([mockIngredient]);

    const summaries = await service.getStockSummary("biz-1", "OWNER");

    expect(summaries.length).toBe(1);
    // Must be 2500.000000 from the Oct 20 purchase, NOT 1000.000000 from Oct 10
    expect(summaries[0]?.latestCostPerBase).toBe("2500.000000");
  });

  it("uses createdAt as tie-breaker when purchasedAt dates are identical", async () => {
    const samePurchasedAt = new Date("2026-10-20T08:00:00Z");

    const mockIngredient = {
      id: "ing-flour",
      name: "Tepung Terigu",
      category: "MAIN",
      baseUnit: "G",
      minStockBase: new Decimal("1000"),
      isActive: true,
      units: [],
      stockBatches: [
        {
          id: "batch-a",
          remainingQtyBase: new Decimal("1000"),
          costPerBase: new Decimal("12.000000"),
          expiryDate: new Date("2026-12-01T00:00:00Z"),
          receivedAt: samePurchasedAt,
          createdAt: new Date("2026-10-20T08:00:00Z"),
          purchase: {
            id: "purch-a",
            purchasedAt: samePurchasedAt,
            createdAt: new Date("2026-10-20T08:00:00Z"),
          },
        },
        {
          id: "batch-b",
          remainingQtyBase: new Decimal("1000"),
          costPerBase: new Decimal("15.000000"),
          expiryDate: new Date("2026-12-15T00:00:00Z"),
          receivedAt: samePurchasedAt,
          createdAt: new Date("2026-10-20T11:00:00Z"), // Created later on the same purchase day
          purchase: {
            id: "purch-b",
            purchasedAt: samePurchasedAt,
            createdAt: new Date("2026-10-20T11:00:00Z"),
          },
        },
      ],
    };

    mockRepo.findIngredientsWithBatches.mockResolvedValueOnce([mockIngredient]);

    const summaries = await service.getStockSummary("biz-1", "OWNER");

    expect(summaries.length).toBe(1);
    // Tie-breaker selects batch-b (createdAt 11:00 > 08:00)
    expect(summaries[0]?.latestCostPerBase).toBe("15.000000");
  });
});
