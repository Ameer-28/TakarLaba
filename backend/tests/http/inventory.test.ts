import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/create-app.js";
import { Decimal } from "decimal.js";

vi.mock("../../src/lib/auth.js", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("../../src/repositories/inventory.repo.js", () => ({
  inventoryRepository: {
    findIngredientsWithBatches: vi.fn(),
    findBatches: vi.fn(),
    findBatchById: vi.fn(),
    recordWasteAtomic: vi.fn(),
    findWasteMovements: vi.fn(),
    recordAdjustmentAtomic: vi.fn(),
    findAdjustmentMovements: vi.fn(),
  },
  InventoryRepository: vi.fn(),
}));

import { auth } from "../../src/lib/auth.js";
import { inventoryRepository } from "../../src/repositories/inventory.repo.js";

describe("Inventory Routes & Service Integration (T-022)", () => {
  const app = createApp();
  const mockBusinessId = "biz-demo-123";

  const ownerSession = {
    user: {
      id: "user-owner-1",
      email: "owner@demo.id",
      name: "Owner Demo",
      role: "OWNER",
      businessId: mockBusinessId,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "sess-1",
      userId: "user-owner-1",
      token: "tok-1",
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const cashierSession = {
    user: {
      id: "user-cashier-1",
      email: "kasir@demo.id",
      name: "Kasir Demo",
      role: "CASHIER",
      businessId: mockBusinessId,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "sess-2",
      userId: "user-cashier-1",
      token: "tok-2",
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/inventory/summary", () => {
    it("returns stock summary with AMAN and SEGERA status and costs for OWNER", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);

      // Expiry dates: one in 2 days (SEGERA), one in 10 days (AMAN)
      const dateSoon = new Date();
      dateSoon.setDate(dateSoon.getDate() + 2);

      const mockIngredients = [
        {
          id: "ing-1",
          name: "Susu UHT",
          category: "MAIN",
          baseUnit: "ML",
          minStockBase: "5000.000" as unknown as Decimal,
          isActive: true,
          units: [],
          stockBatches: [
            {
              id: "batch-1",
              remainingQtyBase: "2000.000" as unknown as Decimal,
              costPerBase: "20.000000" as unknown as Decimal,
              expiryDate: dateSoon,
              receivedAt: new Date(),
            },
            {
              id: "batch-2",
              remainingQtyBase: "1000.000" as unknown as Decimal,
              costPerBase: "22.000000" as unknown as Decimal,
              expiryDate: new Date(Date.now() + 10 * 86400000),
              receivedAt: new Date(),
            },
          ],
        },
      ];

      vi.mocked(inventoryRepository.findIngredientsWithBatches).mockResolvedValueOnce(
        mockIngredients as unknown as Awaited<
          ReturnType<typeof inventoryRepository.findIngredientsWithBatches>
        >
      );

      const res = await request(app)
        .get("/api/inventory/summary")
        .set("Origin", "http://localhost:5173");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveLength(1);

      const item = res.body.data[0];
      expect(item.name).toBe("Susu UHT");
      expect(item.validStockBase).toBe("3000.000"); // 2000 + 1000
      expect(item.status).toBe("SEGERA"); // because batch-1 expires in 2 days
      expect(item.isLowStock).toBe(true); // 3000 <= minStock 5000

      // OWNER receives cost metrics
      expect(item.averageCostPerBase).toBeDefined();
      expect(item.latestCostPerBase).toBeDefined();
    });

    it("strips cost fields for CASHIER role (Rule 7)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(cashierSession);

      const mockIngredients = [
        {
          id: "ing-1",
          name: "Kopi",
          category: "MAIN",
          baseUnit: "G",
          minStockBase: "100.000" as unknown as Decimal,
          isActive: true,
          units: [],
          stockBatches: [
            {
              id: "batch-1",
              remainingQtyBase: "500.000" as unknown as Decimal,
              costPerBase: "100.000000" as unknown as Decimal,
              expiryDate: null,
              receivedAt: new Date(),
            },
          ],
        },
      ];

      vi.mocked(inventoryRepository.findIngredientsWithBatches).mockResolvedValueOnce(
        mockIngredients as unknown as Awaited<
          ReturnType<typeof inventoryRepository.findIngredientsWithBatches>
        >
      );

      const res = await request(app)
        .get("/api/inventory/summary")
        .set("Origin", "http://localhost:5173");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const item = res.body.data[0];
      expect(item.name).toBe("Kopi");
      expect(item.validStockBase).toBe("500.000");

      // Strictly verify no cost fields returned to CASHIER
      expect(item.averageCostPerBase).toBeUndefined();
      expect(item.latestCostPerBase).toBeUndefined();
      expect(item.costPerBase).toBeUndefined();
      expect(item.purchaseUnitPrice).toBeUndefined();
    });
  });

  describe("GET /api/inventory/batches", () => {
    it("returns batch list and strips purchase costs for CASHIER", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(cashierSession);

      const mockBatches = [
        {
          id: "batch-1",
          ingredientId: "ing-1",
          receivedAt: new Date(),
          expiryDate: new Date(Date.now() + 10 * 86400000),
          purchaseQty: "10.000" as unknown as Decimal,
          purchaseUnit: "kg",
          purchaseUnitPrice: "50000.00" as unknown as Decimal,
          initialQtyBase: "10000.000" as unknown as Decimal,
          remainingQtyBase: "10000.000" as unknown as Decimal,
          costPerBase: "50.000000" as unknown as Decimal,
          ingredient: {
            id: "ing-1",
            name: "Beras",
            baseUnit: "G",
            category: "MAIN",
            isPerishable: false,
            minStockBase: "1000.000" as unknown as Decimal,
          },
          purchase: {
            id: "purch-1",
            supplierName: "Toko Sembako",
            purchasedAt: new Date(),
          },
        },
      ];

      vi.mocked(inventoryRepository.findBatches).mockResolvedValueOnce(
        mockBatches as unknown as Awaited<ReturnType<typeof inventoryRepository.findBatches>>
      );

      const res = await request(app)
        .get("/api/inventory/batches")
        .set("Origin", "http://localhost:5173");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const batch = res.body.data[0];
      expect(batch.ingredientName).toBe("Beras");
      expect(batch.status).toBe("AMAN");
      expect(batch.remainingQtyBase).toBe("10000.000");

      // Strip cost fields for CASHIER
      expect(batch.costPerBase).toBeUndefined();
      expect(batch.purchaseUnitPrice).toBeUndefined();
    });

    it("rejects invalid query parameters with 400 VALIDATION_ERROR (C2)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);

      // 1. warnDays=abc on summary
      const resSummaryAbc = await request(app)
        .get("/api/inventory/summary?warnDays=abc")
        .set("Origin", "http://localhost:5173");

      expect(resSummaryAbc.status).toBe(400);
      expect(resSummaryAbc.body.ok).toBe(false);
      expect(resSummaryAbc.body.error.code).toBe("VALIDATION_ERROR");

      // 2. warnDays=50 (exceeds max 30)
      const resSummaryOutRange = await request(app)
        .get("/api/inventory/summary?warnDays=50")
        .set("Origin", "http://localhost:5173");

      expect(resSummaryOutRange.status).toBe(400);
      expect(resSummaryOutRange.body.ok).toBe(false);
      expect(resSummaryOutRange.body.error.code).toBe("VALIDATION_ERROR");

      // 3. hasRemainingOnly=invalid on batches
      const resBatchesInvalid = await request(app)
        .get("/api/inventory/batches?hasRemainingOnly=invalid")
        .set("Origin", "http://localhost:5173");

      expect(resBatchesInvalid.status).toBe(400);
      expect(resBatchesInvalid.body.ok).toBe(false);
      expect(resBatchesInvalid.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("POST /api/stock/waste & /api/inventory/waste (FR-INV-03)", () => {
    it("rejects unauthenticated requests with 401 UNAUTHENTICATED", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const res = await request(app)
        .post("/api/stock/waste")
        .set("Origin", "http://localhost:5173")
        .send({
          batchId: "batch-1",
          qty: 100,
          reason: "Basi karena kulkas mati",
        });

      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHENTICATED");
    });

    it("rejects CASHIER role with 403 FORBIDDEN", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(cashierSession);

      const res = await request(app)
        .post("/api/stock/waste")
        .set("Origin", "http://localhost:5173")
        .send({
          batchId: "batch-1",
          qty: 100,
          reason: "Basi karena kulkas mati",
        });

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("validates mandatory reason and positive quantity with 400 VALIDATION_ERROR", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);

      // Missing reason and negative qty
      const res = await request(app)
        .post("/api/stock/waste")
        .set("Origin", "http://localhost:5173")
        .send({
          batchId: "batch-1",
          qty: -5,
          reason: "a", // too short (< 3 chars)
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 404 NOT_FOUND when batch does not exist", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(inventoryRepository.findBatchById).mockResolvedValueOnce(null);

      const res = await request(app)
        .post("/api/stock/waste")
        .set("Origin", "http://localhost:5173")
        .send({
          batchId: "nonexistent-batch",
          qty: 100,
          reason: "Bahan kedaluwarsa",
        });

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("successfully records waste and returns wasted financial value (201)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);

      const mockBatch = {
        id: "batch-101",
        businessId: mockBusinessId,
        ingredientId: "ing-susu",
        purchaseQty: "10.000" as unknown as Decimal,
        purchaseUnit: "L",
        purchaseUnitPrice: "18000.00" as unknown as Decimal,
        initialQtyBase: "10000.000" as unknown as Decimal,
        remainingQtyBase: "5000.000" as unknown as Decimal,
        costPerBase: "18.000000" as unknown as Decimal,
        expiryDate: new Date(),
        receivedAt: new Date(),
        createdAt: new Date(),
        purchaseId: null,
        ingredient: {
          id: "ing-susu",
          businessId: mockBusinessId,
          name: "Susu UHT",
          nameKey: "susu_uht",
          category: "MAIN",
          baseUnit: "ML",
          yieldPercent: "100.00" as unknown as Decimal,
          minStockBase: "1000.000" as unknown as Decimal,
          isActive: true,
          isPerishable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          units: [
            {
              id: "unit-l",
              ingredientId: "ing-susu",
              name: "L",
              toBaseFactor: "1000.0000" as unknown as Decimal,
              createdAt: new Date(),
            },
          ],
        },
      };

      vi.mocked(inventoryRepository.findBatchById).mockResolvedValueOnce(
        mockBatch as unknown as Awaited<ReturnType<typeof inventoryRepository.findBatchById>>
      );

      vi.mocked(inventoryRepository.recordWasteAtomic).mockResolvedValueOnce({
        movement: {
          id: "mov-waste-1",
          businessId: mockBusinessId,
          ingredientId: "ing-susu",
          batchId: "batch-101",
          type: "WASTE",
          qtyBaseDelta: "-2000.000" as unknown as Decimal,
          costPerBase: "18.000000" as unknown as Decimal,
          refType: "WASTE",
          refId: null,
          note: "Susu asam dan basi",
          createdById: "user-owner-1",
          createdAt: new Date("2026-11-04T05:00:00Z"),
        },
        batch: {
          ...mockBatch,
          remainingQtyBase: "3000.000" as unknown as Decimal,
        },
        ingredient: mockBatch.ingredient,
        qtyBase: new Decimal(2000),
        wastedValue: new Decimal(36000), // 2000 * 18 = 36.000
      } as unknown as Awaited<ReturnType<typeof inventoryRepository.recordWasteAtomic>>);

      // Record 2 L of milk waste (2 L * 1000 = 2000 ml)
      const res = await request(app)
        .post("/api/stock/waste")
        .set("Origin", "http://localhost:5173")
        .send({
          batchId: "batch-101",
          qty: 2,
          unit: "L",
          reason: "Susu asam dan basi",
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.movementId).toBe("mov-waste-1");
      expect(res.body.data.ingredientName).toBe("Susu UHT");
      expect(res.body.data.qtyBase).toBe("2000.000");
      expect(res.body.data.baseUnit).toBe("ML");
      expect(res.body.data.remainingQtyBase).toBe("3000.000");
      expect(res.body.data.costPerBase).toBe("18.000000");
      expect(res.body.data.wastedValue).toBe("36000.00");
      expect(res.body.data.reason).toBe("Susu asam dan basi");
    });
  });

  describe("GET /api/stock/waste & /api/inventory/waste", () => {
    it("returns waste history list for OWNER", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);

      vi.mocked(inventoryRepository.findWasteMovements).mockResolvedValueOnce([
        {
          id: "mov-waste-1",
          businessId: mockBusinessId,
          ingredientId: "ing-susu",
          batchId: "batch-101",
          type: "WASTE",
          qtyBaseDelta: "-2000.000" as unknown as Decimal,
          costPerBase: "18.000000" as unknown as Decimal,
          refType: "WASTE",
          refId: null,
          note: "Susu asam dan basi",
          createdById: "user-owner-1",
          createdAt: new Date("2026-11-04T05:00:00Z"),
          ingredient: {
            id: "ing-susu",
            name: "Susu UHT",
            baseUnit: "ML",
            category: "MAIN",
          },
          batch: {
            id: "batch-101",
            purchaseUnit: "L",
            purchaseUnitPrice: "18000.00" as unknown as Decimal,
            expiryDate: new Date(),
          },
          createdBy: {
            id: "user-owner-1",
            name: "Owner Demo",
          },
        },
      ] as unknown as Awaited<ReturnType<typeof inventoryRepository.findWasteMovements>>);

      const res = await request(app)
        .get("/api/inventory/waste")
        .set("Origin", "http://localhost:5173");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].ingredientName).toBe("Susu UHT");
      expect(res.body.data[0].qtyBase).toBe("2000.000");
      expect(res.body.data[0].wastedValue).toBe("36000.00");
      expect(res.body.data[0].reason).toBe("Susu asam dan basi");
      expect(res.body.data[0].createdByName).toBe("Owner Demo");
    });
  });

  describe("POST & GET /api/inventory/adjustments & /api/stock/adjustments (T-204)", () => {
    it("should return 401 when unauthenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const resPost = await request(app)
        .post("/api/inventory/adjustments")
        .set("Origin", "http://localhost:5173")
        .send({ batchId: "b-1", actualQty: 500, reason: "Opname mingguan" });
      expect(resPost.status).toBe(401);

      const resGet = await request(app)
        .get("/api/inventory/adjustments")
        .set("Origin", "http://localhost:5173");
      expect(resGet.status).toBe(401);
    });

    it("should return 403 when user is CASHIER", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(cashierSession as never);

      const resPost = await request(app)
        .post("/api/stock/adjustments")
        .set("Origin", "http://localhost:5173")
        .send({ batchId: "b-1", actualQty: 500, reason: "Opname mingguan" });
      expect(resPost.status).toBe(403);

      const resGet = await request(app)
        .get("/api/stock/adjustments")
        .set("Origin", "http://localhost:5173");
      expect(resGet.status).toBe(403);
    });

    it("should return 400 when input validation fails", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession as never);

      const res = await request(app)
        .post("/api/inventory/adjustments")
        .set("Origin", "http://localhost:5173")
        .send({ batchId: "", actualQty: -5, reason: "a" });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 404 when batch is not found", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession as never);
      vi.mocked(inventoryRepository.findBatchById).mockResolvedValue(null);

      const res = await request(app)
        .post("/api/inventory/adjustments")
        .set("Origin", "http://localhost:5173")
        .send({
          batchId: "non-existent",
          actualQty: 100,
          reason: "Koreksi selisih hitung fisik",
        });

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.message).toContain("Batch bahan baku tidak ditemukan");
    });

    it("should successfully record a stock adjustment and return 201", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession as never);

      vi.mocked(inventoryRepository.findBatchById).mockResolvedValue({
        id: "batch-101",
        businessId: mockBusinessId,
        ingredientId: "ing-susu",
        remainingQtyBase: "5000.000" as unknown as Decimal,
        costPerBase: "18.000000" as unknown as Decimal,
        ingredient: {
          id: "ing-susu",
          name: "Susu UHT",
          baseUnit: "ML",
          units: [{ id: "u-1", name: "L", toBaseFactor: "1000.0000" as unknown as Decimal }],
        },
      } as unknown as Awaited<ReturnType<typeof inventoryRepository.findBatchById>>);

      vi.mocked(inventoryRepository.recordAdjustmentAtomic).mockResolvedValue({
        movement: {
          id: "mov-adj-1",
          note: "Koreksi susut penyimpanan",
          createdAt: new Date("2026-11-05T08:00:00Z"),
        },
        batch: {
          id: "batch-101",
          remainingQtyBase: "4500.000" as unknown as Decimal,
          costPerBase: "18.000000" as unknown as Decimal,
        },
        ingredient: {
          id: "ing-susu",
          name: "Susu UHT",
          baseUnit: "ML",
        },
        previousQtyBase: new Decimal("5000.000"),
        actualQtyBase: new Decimal("4500.000"),
        deltaQtyBase: new Decimal("-500.000"),
        diffValue: new Decimal("-9000.00"),
      } as unknown as Awaited<ReturnType<typeof inventoryRepository.recordAdjustmentAtomic>>);

      const res = await request(app)
        .post("/api/inventory/adjustments")
        .set("Origin", "http://localhost:5173")
        .send({
          batchId: "batch-101",
          actualQty: 4500,
          reason: "Koreksi susut penyimpanan",
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.movementId).toBe("mov-adj-1");
      expect(res.body.data.ingredientName).toBe("Susu UHT");
      expect(res.body.data.previousQtyBase).toBe("5000.000");
      expect(res.body.data.actualQtyBase).toBe("4500.000");
      expect(res.body.data.deltaQtyBase).toBe("-500.000");
      expect(res.body.data.diffValue).toBe("-9000.00");
    });

    it("should retrieve adjustment history for OWNER", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession as never);

      vi.mocked(inventoryRepository.findAdjustmentMovements).mockResolvedValue([
        {
          id: "mov-adj-1",
          ingredientId: "ing-susu",
          batchId: "batch-101",
          type: "ADJUSTMENT",
          qtyBaseDelta: "-500.000" as unknown as Decimal,
          costPerBase: "18.000000" as unknown as Decimal,
          note: "Koreksi susut penyimpanan",
          createdAt: new Date("2026-11-05T08:00:00Z"),
          ingredient: {
            id: "ing-susu",
            name: "Susu UHT",
            baseUnit: "ML",
            category: "MAIN",
          },
          batch: {
            id: "batch-101",
            purchaseUnit: "L",
            purchaseUnitPrice: "18000.00" as unknown as Decimal,
            expiryDate: new Date(),
          },
          createdBy: {
            id: "user-owner-1",
            name: "Owner Demo",
          },
        },
      ] as unknown as Awaited<ReturnType<typeof inventoryRepository.findAdjustmentMovements>>);

      const res = await request(app)
        .get("/api/inventory/adjustments")
        .set("Origin", "http://localhost:5173");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].ingredientName).toBe("Susu UHT");
      expect(res.body.data[0].deltaQtyBase).toBe("-500.000");
      expect(res.body.data[0].diffValue).toBe("-9000.00");
      expect(res.body.data[0].createdByName).toBe("Owner Demo");
    });
  });
});
