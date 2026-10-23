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
  });
});
