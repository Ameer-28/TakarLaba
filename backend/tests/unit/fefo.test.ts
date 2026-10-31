import { describe, it, expect } from "vitest";
import { Decimal } from "decimal.js";
import { allocateFefo, compareBatchesFefo, type FefoBatch } from "../../src/domain/fefo.js";

describe("FEFO Stock Allocation Engine (T-040 — BR-07, BR-02, BR-04)", () => {
  // Use a fixed reference date for tests: 2026-10-29 10:00:00 WIB
  const refDate = new Date("2026-10-29T10:00:00.000+07:00");

  describe("compareBatchesFefo sorting comparator (BR-07)", () => {
    it("sorts by expiryDate ASC NULLS LAST, receivedAt ASC, id ASC", () => {
      const b1: FefoBatch = {
        id: "batch-c",
        remainingQtyBase: 10,
        costPerBase: 100,
        expiryDate: "2026-11-10",
        receivedAt: "2026-10-20T08:00:00Z",
      };
      const b2: FefoBatch = {
        id: "batch-a",
        remainingQtyBase: 10,
        costPerBase: 100,
        expiryDate: "2026-11-01", // earlier expiry
        receivedAt: "2026-10-22T08:00:00Z",
      };
      const b3: FefoBatch = {
        id: "batch-null-1",
        remainingQtyBase: 10,
        costPerBase: 100,
        expiryDate: null, // null expiry
        receivedAt: "2026-10-15T08:00:00Z",
      };
      const b4: FefoBatch = {
        id: "batch-null-2",
        remainingQtyBase: 10,
        costPerBase: 100,
        expiryDate: null,
        receivedAt: "2026-10-18T08:00:00Z", // later receivedAt
      };
      const b5: FefoBatch = {
        id: "batch-tie-b",
        remainingQtyBase: 10,
        costPerBase: 100,
        expiryDate: "2026-11-01",
        receivedAt: "2026-10-22T08:00:00Z", // same expiry and receivedAt as b2, higher id
      };

      const sorted = [b1, b4, b2, b3, b5].sort(compareBatchesFefo);

      expect(sorted.map((b) => b.id)).toEqual([
        "batch-a", // 2026-11-01, id: batch-a
        "batch-tie-b", // 2026-11-01, id: batch-tie-b
        "batch-c", // 2026-11-10
        "batch-null-1", // null expiry, received Oct 15
        "batch-null-2", // null expiry, received Oct 18
      ]);
    });
  });

  describe("Batch campur (Multiple batches allocation)", () => {
    it("allocates across multiple batches in correct order and computes actual ingredient cost", () => {
      // Need 150g coffee beans
      // Batch 1: 100g @ Rp160/g, expires Nov 5
      // Batch 2: 100g @ Rp180/g, expires Nov 12
      const batches: FefoBatch[] = [
        {
          id: "batch-2",
          remainingQtyBase: "100.000",
          costPerBase: "180.000000",
          expiryDate: "2026-11-12",
          receivedAt: "2026-10-20",
        },
        {
          id: "batch-1",
          remainingQtyBase: "100.000",
          costPerBase: "160.000000",
          expiryDate: "2026-11-05", // earlier expiry -> should be consumed first
          receivedAt: "2026-10-18",
        },
      ];

      const result = allocateFefo(batches, 150, { referenceDate: refDate });

      expect(result.isShortage).toBe(false);
      expect(result.shortageQty.toString()).toBe("0");
      expect(result.totalAllocated.toString()).toBe("150");
      // Total cost: (100 * 160) + (50 * 180) = 16.000 + 9.000 = 25.000
      expect(result.totalCost.toString()).toBe("25000");

      expect(result.allocations).toHaveLength(2);

      // Allocation 1: entire batch-1
      expect(result.allocations[0]).toMatchObject({
        batchId: "batch-1",
        allocatedQty: new Decimal(100),
        costPerBase: new Decimal(160),
        subtotalCost: new Decimal(16000),
        remainingQtyAfter: new Decimal(0),
      });

      // Allocation 2: 50 from batch-2
      expect(result.allocations[1]).toMatchObject({
        batchId: "batch-2",
        allocatedQty: new Decimal(50),
        costPerBase: new Decimal(180),
        subtotalCost: new Decimal(9000),
        remainingQtyAfter: new Decimal(50),
      });

      // Verify in-memory mutation
      const batch1 = batches.find((b) => b.id === "batch-1")!;
      const batch2 = batches.find((b) => b.id === "batch-2")!;
      expect(new Decimal(batch1.remainingQtyBase.toString()).toNumber()).toBe(0);
      expect(new Decimal(batch2.remainingQtyBase.toString()).toNumber()).toBe(50);
    });

    it("respects mutate: false without modifying original batch objects", () => {
      const batches: FefoBatch[] = [
        {
          id: "batch-immutable",
          remainingQtyBase: "100.000",
          costPerBase: "150.000000",
          expiryDate: "2026-11-20",
        },
      ];

      const result = allocateFefo(batches, 40, { referenceDate: refDate, mutate: false });

      expect(result.totalAllocated.toString()).toBe("40");
      expect(result.allocations[0]!.remainingQtyAfter.toString()).toBe("60");
      // Original batch remains 100
      expect(batches[0]!.remainingQtyBase.toString()).toBe("100.000");
    });
  });

  describe("Kedaluwarsa (Expired batches filtering - BR-07)", () => {
    it("completely skips expired batches and only allocates from valid batches", () => {
      const batches: FefoBatch[] = [
        {
          id: "batch-expired",
          remainingQtyBase: "100.000",
          costPerBase: "100.000000",
          expiryDate: "2026-10-28", // strictly before 2026-10-29 -> expired in WIB!
          receivedAt: "2026-10-15",
        },
        {
          id: "batch-valid",
          remainingQtyBase: "80.000",
          costPerBase: "120.000000",
          expiryDate: "2026-11-05", // valid
          receivedAt: "2026-10-25",
        },
      ];

      const result = allocateFefo(batches, 50, { referenceDate: refDate });

      expect(result.isShortage).toBe(false);
      expect(result.totalAllocated.toString()).toBe("50");
      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0]!.batchId).toBe("batch-valid");
      expect(result.allocations[0]!.subtotalCost.toString()).toBe("6000"); // 50 * 120

      // Expired batch was not touched!
      const expiredBatch = batches.find((b) => b.id === "batch-expired")!;
      expect(expiredBatch.remainingQtyBase.toString()).toBe("100.000");

      const validBatch = batches.find((b) => b.id === "batch-valid")!;
      expect(validBatch.remainingQtyBase.toString()).toBe("30");
    });

    it("treats batch expiring today (WIB) as still valid until the end of today (BR-07, ARCHITECTURE §5.1)", () => {
      const batches: FefoBatch[] = [
        {
          id: "batch-today",
          remainingQtyBase: "40.000",
          costPerBase: "150.000000",
          expiryDate: "2026-10-29", // expires today!
          receivedAt: "2026-10-20",
        },
        {
          id: "batch-tomorrow",
          remainingQtyBase: "50.000",
          costPerBase: "160.000000",
          expiryDate: "2026-10-30",
          receivedAt: "2026-10-22",
        },
      ];

      const result = allocateFefo(batches, 50, { referenceDate: refDate });

      expect(result.isShortage).toBe(false);
      expect(result.allocations).toHaveLength(2);
      // batch-today is valid and consumed first because it expires sooner
      expect(result.allocations[0]!.batchId).toBe("batch-today");
      expect(result.allocations[0]!.allocatedQty.toString()).toBe("40");
      expect(result.allocations[1]!.batchId).toBe("batch-tomorrow");
      expect(result.allocations[1]!.allocatedQty.toString()).toBe("10");
    });

    it("triggers shortage when only expired batches exist", () => {
      const batches: FefoBatch[] = [
        {
          id: "batch-dead",
          remainingQtyBase: "500.000",
          costPerBase: "100.000000",
          expiryDate: "2026-10-20", // expired
        },
      ];

      const result = allocateFefo(batches, 10, { referenceDate: refDate });

      expect(result.isShortage).toBe(true);
      expect(result.availableQty.toString()).toBe("0");
      expect(result.shortageQty.toString()).toBe("10");
      expect(result.allocations).toHaveLength(0);
      expect(batches[0]!.remainingQtyBase.toString()).toBe("500.000"); // untouched
    });
  });

  describe("Null expiry (Non-perishable batches - BR-07 NULLS LAST)", () => {
    it("allocates perishable batches first and null expiry batches last", () => {
      const batches: FefoBatch[] = [
        {
          id: "batch-cup-null",
          remainingQtyBase: "100.000",
          costPerBase: "500.000000",
          expiryDate: null, // non-perishable cup
          receivedAt: "2026-10-01",
        },
        {
          id: "batch-perishable-1",
          remainingQtyBase: "30.000",
          costPerBase: "400.000000",
          expiryDate: "2026-11-30",
          receivedAt: "2026-10-10",
        },
      ];

      const result = allocateFefo(batches, 50, { referenceDate: refDate });

      expect(result.isShortage).toBe(false);
      expect(result.allocations).toHaveLength(2);

      // Perishable with expiry date allocated first
      expect(result.allocations[0]!.batchId).toBe("batch-perishable-1");
      expect(result.allocations[0]!.allocatedQty.toString()).toBe("30");

      // Null expiry allocated second
      expect(result.allocations[1]!.batchId).toBe("batch-cup-null");
      expect(result.allocations[1]!.allocatedQty.toString()).toBe("20");
      expect(result.allocations[1]!.remainingQtyAfter.toString()).toBe("80");
    });

    it("sorts multiple null-expiry batches by receivedAt ASC (FIFO fallback)", () => {
      const batches: FefoBatch[] = [
        {
          id: "batch-later",
          remainingQtyBase: "50.000",
          costPerBase: "520.000000",
          expiryDate: null,
          receivedAt: "2026-10-20",
        },
        {
          id: "batch-earlier",
          remainingQtyBase: "50.000",
          costPerBase: "500.000000",
          expiryDate: null,
          receivedAt: "2026-10-10", // received earlier
        },
      ];

      const result = allocateFefo(batches, 60, { referenceDate: refDate });

      expect(result.allocations[0]!.batchId).toBe("batch-earlier");
      expect(result.allocations[0]!.allocatedQty.toString()).toBe("50");
      expect(result.allocations[1]!.batchId).toBe("batch-later");
      expect(result.allocations[1]!.allocatedQty.toString()).toBe("10");
    });
  });

  describe("Kurang stok (Shortage & atomicity)", () => {
    it("reports shortage and leaves all batches un-mutated when allowPartial is false (default)", () => {
      const batches: FefoBatch[] = [
        {
          id: "batch-s1",
          remainingQtyBase: "30.000",
          costPerBase: "100.000000",
          expiryDate: "2026-11-10",
        },
        {
          id: "batch-s2",
          remainingQtyBase: "40.000",
          costPerBase: "110.000000",
          expiryDate: "2026-11-15",
        },
      ];

      // Total available = 70. Need = 100. Shortage = 30.
      const result = allocateFefo(batches, 100, { referenceDate: refDate });

      expect(result.isShortage).toBe(true);
      expect(result.shortageQty.toString()).toBe("30");
      expect(result.availableQty.toString()).toBe("70");
      expect(result.totalAllocated.toString()).toBe("0");
      expect(result.allocations).toHaveLength(0);

      // Crucial: no partial deduction happened!
      expect(batches[0]!.remainingQtyBase.toString()).toBe("30.000");
      expect(batches[1]!.remainingQtyBase.toString()).toBe("40.000");
    });

    it("allows partial allocation when allowPartial: true", () => {
      const batches: FefoBatch[] = [
        {
          id: "batch-p1",
          remainingQtyBase: "25.000",
          costPerBase: "100.000000",
          expiryDate: "2026-11-10",
        },
      ];

      // Need = 40. Available = 25.
      const result = allocateFefo(batches, 40, { referenceDate: refDate, allowPartial: true });

      expect(result.isShortage).toBe(true);
      expect(result.shortageQty.toString()).toBe("15");
      expect(result.totalAllocated.toString()).toBe("25");
      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0]!.allocatedQty.toString()).toBe("25");
      expect(batches[0]!.remainingQtyBase.toString()).toBe("0");
    });

    it("handles completely empty batch list with shortage", () => {
      const result = allocateFefo([], 50, { referenceDate: refDate });
      expect(result.isShortage).toBe(true);
      expect(result.shortageQty.toString()).toBe("50");
      expect(result.availableQty.toString()).toBe("0");
      expect(result.allocations).toHaveLength(0);
    });

    it("skips batches with zero remaining quantity", () => {
      const batches: FefoBatch[] = [
        {
          id: "batch-depleted",
          remainingQtyBase: "0.000",
          costPerBase: "100.000000",
          expiryDate: "2026-11-01",
        },
        {
          id: "batch-active",
          remainingQtyBase: "20.000",
          costPerBase: "100.000000",
          expiryDate: "2026-11-05",
        },
      ];

      const result = allocateFefo(batches, 20, { referenceDate: refDate });
      expect(result.isShortage).toBe(false);
      expect(result.allocations).toHaveLength(1);
      expect(result.allocations[0]!.batchId).toBe("batch-active");
    });
  });

  describe("Sequential multi-item in-memory checkout (ARCHITECTURE §5.1)", () => {
    it("depletes batches sequentially across multiple sale items in a transaction", () => {
      // Simulating a shopping cart with 2 cups of coffee
      // Total beans in inventory: Batch 1 (25g), Batch 2 (100g)
      const beanBatches: FefoBatch[] = [
        {
          id: "beans-batch-1",
          remainingQtyBase: "25.000",
          costPerBase: "160.000000",
          expiryDate: "2026-11-01",
        },
        {
          id: "beans-batch-2",
          remainingQtyBase: "100.000",
          costPerBase: "175.000000",
          expiryDate: "2026-11-15",
        },
      ];

      // Item 1: Es Kopi Susu (needs 18g beans)
      const allocItem1 = allocateFefo(beanBatches, 18, { referenceDate: refDate });
      expect(allocItem1.isShortage).toBe(false);
      expect(allocItem1.allocations).toHaveLength(1);
      expect(allocItem1.allocations[0]!.batchId).toBe("beans-batch-1");
      expect(allocItem1.allocations[0]!.allocatedQty.toString()).toBe("18");
      // Batch 1 now has 7g left
      expect(beanBatches[0]!.remainingQtyBase.toString()).toBe("7");

      // Item 2: Americano (needs 18g beans)
      // Should take remaining 7g from batch 1, and 11g from batch 2!
      const allocItem2 = allocateFefo(beanBatches, 18, { referenceDate: refDate });
      expect(allocItem2.isShortage).toBe(false);
      expect(allocItem2.allocations).toHaveLength(2);
      expect(allocItem2.allocations[0]!.batchId).toBe("beans-batch-1");
      expect(allocItem2.allocations[0]!.allocatedQty.toString()).toBe("7");
      expect(allocItem2.allocations[1]!.batchId).toBe("beans-batch-2");
      expect(allocItem2.allocations[1]!.allocatedQty.toString()).toBe("11");

      // Final batch balances
      expect(beanBatches[0]!.remainingQtyBase.toString()).toBe("0");
      expect(beanBatches[1]!.remainingQtyBase.toString()).toBe("89");
    });
  });

  describe("Edge cases & zero/negative inputs", () => {
    it("returns zero allocations and no shortage when requiredQty <= 0", () => {
      const batches: FefoBatch[] = [
        {
          id: "b1",
          remainingQtyBase: 50,
          costPerBase: 100,
        },
      ];

      const resZero = allocateFefo(batches, 0, { referenceDate: refDate });
      expect(resZero.isShortage).toBe(false);
      expect(resZero.totalAllocated.toString()).toBe("0");
      expect(resZero.allocations).toHaveLength(0);

      const resNeg = allocateFefo(batches, -5, { referenceDate: refDate });
      expect(resNeg.isShortage).toBe(false);
      expect(resNeg.totalAllocated.toString()).toBe("0");
    });

    it("handles decimal precision and rounding correctly without float inaccuracies", () => {
      const batches: FefoBatch[] = [
        {
          id: "b-dec",
          remainingQtyBase: "0.333",
          costPerBase: "12345.678900",
          expiryDate: "2026-11-20",
        },
      ];

      const res = allocateFefo(batches, "0.100", { referenceDate: refDate });
      expect(res.totalAllocated.toString()).toBe("0.1");
      expect(res.allocations[0]!.remainingQtyAfter.toString()).toBe("0.233");
      // 0.1 * 12345.6789 = 1234.56789 -> toMoney (2 decimals, ROUND_HALF_UP) = 1234.57
      expect(res.totalCost.toString()).toBe("1234.57");
    });
  });
});
