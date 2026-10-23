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

vi.mock("../../src/repositories/purchase.repo.js", () => ({
  purchaseRepository: {
    createAtomic: vi.fn(),
    findMany: vi.fn(),
    findById: vi.fn(),
  },
  PurchaseRepository: vi.fn(),
}));

vi.mock("../../src/repositories/ingredient.repo.js", () => ({
  ingredientRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    findByNameKey: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findActiveMenusUsingIngredient: vi.fn(),
    isUsedInBatchesOrRecipes: vi.fn(),
    addUnit: vi.fn(),
    deleteUnit: vi.fn(),
  },
  IngredientRepository: vi.fn(),
}));

import { auth } from "../../src/lib/auth.js";
import { purchaseRepository } from "../../src/repositories/purchase.repo.js";
import { ingredientRepository } from "../../src/repositories/ingredient.repo.js";

describe("Purchase Routes & Service Integration (T-021)", () => {
  const app = createApp();
  const mockBusinessId = "biz-demo-123";
  const mockUserId = "user-owner-1";

  const ownerSession = {
    user: {
      id: mockUserId,
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
      userId: mockUserId,
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

  const mockKopi = {
    id: "ing-kopi",
    businessId: mockBusinessId,
    name: "Kopi Arabika",
    nameKey: "kopi arabika",
    category: "MAIN",
    baseUnit: "G",
    yieldPercent: 100,
    isPerishable: false,
    minStockBase: 500,
    isActive: true,
    units: [
      {
        id: "unit-kg",
        ingredientId: "ing-kopi",
        name: "kg",
        toBaseFactor: new Decimal(1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const mockSusu = {
    id: "ing-susu",
    businessId: mockBusinessId,
    name: "Susu Segar",
    nameKey: "susu segar",
    category: "MAIN",
    baseUnit: "ML",
    yieldPercent: 100,
    isPerishable: true, // Requires expiry date
    minStockBase: 2000,
    isActive: true,
    units: [
      {
        id: "unit-liter",
        ingredientId: "ing-susu",
        name: "liter",
        toBaseFactor: new Decimal(1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/purchases", () => {
    it("successfully records a multi-row purchase with unit conversions", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);

      vi.mocked(ingredientRepository.findById).mockImplementation(
        async (_businessId: string, id: string) => {
          if (id === "ing-kopi")
            return mockKopi as unknown as Awaited<ReturnType<typeof ingredientRepository.findById>>;
          if (id === "ing-susu")
            return mockSusu as unknown as Awaited<ReturnType<typeof ingredientRepository.findById>>;
          return null;
        }
      );

      vi.mocked(purchaseRepository.createAtomic).mockResolvedValueOnce({
        id: "purch-1",
        businessId: mockBusinessId,
        supplierName: "Toko Bahan Berkah",
        note: "Belanja mingguan",
        totalAmount: "300000.00" as unknown as Decimal,
        purchasedAt: new Date(),
        createdById: mockUserId,
        createdAt: new Date(),
        batches: [
          {
            id: "batch-1",
            businessId: mockBusinessId,
            ingredientId: "ing-kopi",
            purchaseId: "purch-1",
            purchaseQty: "2.000" as unknown as Decimal,
            purchaseUnit: "kg",
            purchaseUnitPrice: "100000.00" as unknown as Decimal,
            initialQtyBase: "2000.000" as unknown as Decimal,
            remainingQtyBase: "2000.000" as unknown as Decimal,
            costPerBase: "100.000000" as unknown as Decimal,
          },
          {
            id: "batch-2",
            businessId: mockBusinessId,
            ingredientId: "ing-susu",
            purchaseId: "purch-1",
            purchaseQty: "5.000" as unknown as Decimal,
            purchaseUnit: "liter",
            purchaseUnitPrice: "20000.00" as unknown as Decimal,
            initialQtyBase: "5000.000" as unknown as Decimal,
            remainingQtyBase: "5000.000" as unknown as Decimal,
            costPerBase: "20.000000" as unknown as Decimal,
          },
        ] as unknown as Awaited<ReturnType<typeof purchaseRepository.createAtomic>>["batches"],
      });

      // Expiry date far in future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split("T")[0]!;

      const res = await request(app)
        .post("/api/purchases")
        .set("Origin", "http://localhost:5173")
        .send({
          supplierName: "Toko Bahan Berkah",
          note: "Belanja mingguan",
          items: [
            {
              ingredientId: "ing-kopi",
              purchaseQty: 2,
              purchaseUnit: "kg",
              purchaseUnitPrice: 100000,
            },
            {
              ingredientId: "ing-susu",
              purchaseQty: 5,
              purchaseUnit: "liter",
              purchaseUnitPrice: 20000,
              expiryDate: futureDateStr,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.id).toBe("purch-1");
      expect(purchaseRepository.createAtomic).toHaveBeenCalledWith(
        expect.objectContaining({
          businessId: mockBusinessId,
          supplierName: "Toko Bahan Berkah",
          batches: expect.arrayContaining([
            expect.objectContaining({
              ingredientId: "ing-kopi",
              purchaseQty: expect.any(Decimal),
              initialQtyBase: expect.any(Decimal),
              costPerBase: expect.any(Decimal),
            }),
            expect.objectContaining({
              ingredientId: "ing-susu",
              purchaseQty: expect.any(Decimal),
              initialQtyBase: expect.any(Decimal),
              costPerBase: expect.any(Decimal),
            }),
          ]),
        })
      );
    });

    it("rejects CASHIER from accessing purchase entry with 403 FORBIDDEN (Rule 7)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(cashierSession);

      const res = await request(app)
        .post("/api/purchases")
        .set("Origin", "http://localhost:5173")
        .send({
          items: [
            {
              ingredientId: "ing-kopi",
              purchaseQty: 1,
              purchaseUnit: "kg",
              purchaseUnitPrice: 50000,
            },
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("rejects purchase when perishable ingredient lacks expiryDate", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(ingredientRepository.findById).mockResolvedValueOnce(
        mockSusu as unknown as Awaited<ReturnType<typeof ingredientRepository.findById>>
      );

      const res = await request(app)
        .post("/api/purchases")
        .set("Origin", "http://localhost:5173")
        .send({
          items: [
            {
              ingredientId: "ing-susu",
              purchaseQty: 5,
              purchaseUnit: "liter",
              purchaseUnitPrice: 20000,
              // expiryDate is missing!
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toContain("Tanggal kedaluwarsa wajib diisi");
    });

    it("rejects purchase when expiryDate is before today", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(ingredientRepository.findById).mockResolvedValueOnce(
        mockSusu as unknown as Awaited<ReturnType<typeof ingredientRepository.findById>>
      );

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      const pastDateStr = pastDate.toISOString().split("T")[0]!;

      const res = await request(app)
        .post("/api/purchases")
        .set("Origin", "http://localhost:5173")
        .send({
          items: [
            {
              ingredientId: "ing-susu",
              purchaseQty: 5,
              purchaseUnit: "liter",
              purchaseUnitPrice: 20000,
              expiryDate: pastDateStr,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.message).toContain("tidak boleh sebelum hari ini");
    });

    it("rejects purchase when purchaseUnit is not registered on ingredient", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(ingredientRepository.findById).mockResolvedValueOnce(
        mockKopi as unknown as Awaited<ReturnType<typeof ingredientRepository.findById>>
      );

      const res = await request(app)
        .post("/api/purchases")
        .set("Origin", "http://localhost:5173")
        .send({
          items: [
            {
              ingredientId: "ing-kopi",
              purchaseQty: 10,
              purchaseUnit: "ember", // invalid unregistered unit
              purchaseUnitPrice: 50000,
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.message).toContain("tidak terdaftar pada bahan");
    });

    it("rejects purchase with 404 NOT_FOUND when ingredient does not exist", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(ingredientRepository.findById).mockResolvedValueOnce(null);

      const res = await request(app)
        .post("/api/purchases")
        .set("Origin", "http://localhost:5173")
        .send({
          items: [
            {
              ingredientId: "ing-nonexistent",
              purchaseQty: 1,
              purchaseUnit: "kg",
              purchaseUnitPrice: 10000,
            },
          ],
        });

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("rolls back and returns 500 INTERNAL if atomic database transaction fails", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(ingredientRepository.findById).mockResolvedValueOnce(
        mockKopi as unknown as Awaited<ReturnType<typeof ingredientRepository.findById>>
      );

      vi.mocked(purchaseRepository.createAtomic).mockRejectedValueOnce(
        new Error("Database deadlock during batch insertion")
      );

      const res = await request(app)
        .post("/api/purchases")
        .set("Origin", "http://localhost:5173")
        .send({
          items: [
            {
              ingredientId: "ing-kopi",
              purchaseQty: 1,
              purchaseUnit: "kg",
              purchaseUnitPrice: 100000,
            },
          ],
        });

      expect(res.status).toBe(500);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("INTERNAL_ERROR");
      // Must not leak internal database error message to client (Rule 17)
      expect(res.body.error.message).not.toContain("deadlock");
    });

    it("pre-validates all rows and avoids calling createAtomic if subsequent item is invalid", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(ingredientRepository.findById).mockImplementation(
        async (_businessId: string, id: string) => {
          if (id === "ing-kopi")
            return mockKopi as unknown as Awaited<ReturnType<typeof ingredientRepository.findById>>;
          if (id === "ing-susu")
            return mockSusu as unknown as Awaited<ReturnType<typeof ingredientRepository.findById>>;
          return null;
        }
      );

      // Susu is perishable but expiryDate is omitted in the second item
      const res = await request(app)
        .post("/api/purchases")
        .set("Origin", "http://localhost:5173")
        .send({
          items: [
            {
              ingredientId: "ing-kopi",
              purchaseQty: 1,
              purchaseUnit: "kg",
              purchaseUnitPrice: 100000,
            },
            {
              ingredientId: "ing-susu",
              purchaseQty: 2,
              purchaseUnit: "liter",
              purchaseUnitPrice: 20000,
              // missing expiryDate!
            },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toContain("Baris 2");
      // Ensure transaction repository method was NEVER called
      expect(purchaseRepository.createAtomic).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/purchases", () => {
    it("returns purchase history for OWNER", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(purchaseRepository.findMany).mockResolvedValueOnce({
        items: [
          {
            id: "purch-1",
            businessId: mockBusinessId,
            supplierName: "Supplier A",
            totalAmount: "150000.00" as unknown as Decimal,
            purchasedAt: new Date(),
            batches: [],
            createdBy: { id: mockUserId, name: "Owner", email: "owner@demo.id" },
          },
        ] as unknown as Awaited<ReturnType<typeof purchaseRepository.findMany>>["items"],
        total: 1,
      });

      const res = await request(app).get("/api/purchases").set("Origin", "http://localhost:5173");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.total).toBe(1);
    });
  });
});
