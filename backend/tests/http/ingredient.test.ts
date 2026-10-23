import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/create-app.js";

vi.mock("../../src/lib/auth.js", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("../../src/repositories/ingredient.repo.js", () => {
  return {
    ingredientRepository: {
      findMany: vi.fn(),
      findById: vi.fn(),
      findByNameKey: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      isUsedInBatchesOrRecipes: vi.fn(),
      findActiveMenusUsingIngredient: vi.fn(),
      addUnit: vi.fn(),
      deleteUnit: vi.fn(),
    },
    IngredientRepository: vi.fn(),
  };
});

import { auth } from "../../src/lib/auth.js";
import { ingredientRepository } from "../../src/repositories/ingredient.repo.js";

describe("Ingredient Routes & Service Integration (T-020)", () => {
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

  describe("GET /api/ingredients", () => {
    it("allows OWNER and CASHIER to view ingredients list", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(ingredientRepository.findMany).mockResolvedValueOnce([
        {
          id: "ing-1",
          businessId: mockBusinessId,
          name: "Biji Kopi House Blend",
          nameKey: "biji kopi house blend",
          category: "MAIN",
          baseUnit: "G",
          yieldPercent: "100.00" as unknown as import("@prisma/client/runtime/library").Decimal,
          isPerishable: false,
          minStockBase: "500.000" as unknown as import("@prisma/client/runtime/library").Decimal,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          units: [
            {
              id: "unit-1",
              ingredientId: "ing-1",
              name: "kg",
              toBaseFactor:
                "1000.0000" as unknown as import("@prisma/client/runtime/library").Decimal,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ]);

      const res = await request(app).get("/api/ingredients");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("Biji Kopi House Blend");
      expect(ingredientRepository.findMany).toHaveBeenCalledWith(mockBusinessId, {
        search: undefined,
        category: undefined,
        isActive: undefined,
      });
    });

    it("filters ingredients by category and search query", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(cashierSession);
      vi.mocked(ingredientRepository.findMany).mockResolvedValueOnce([]);

      const res = await request(app).get("/api/ingredients?category=MAIN&search=kopi");

      expect(res.status).toBe(200);
      expect(ingredientRepository.findMany).toHaveBeenCalledWith(mockBusinessId, {
        search: "kopi",
        category: "MAIN",
        isActive: undefined,
      });
    });
  });

  describe("POST /api/ingredients", () => {
    it("creates an ingredient with conversion units for OWNER", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(ingredientRepository.findByNameKey).mockResolvedValueOnce(null);
      vi.mocked(ingredientRepository.create).mockResolvedValueOnce({
        id: "ing-created",
        businessId: mockBusinessId,
        name: "Susu UHT",
        nameKey: "susu uht",
        category: "MAIN",
        baseUnit: "ML",
        yieldPercent: "100.00" as unknown as import("@prisma/client/runtime/library").Decimal,
        isPerishable: true,
        minStockBase: "2000.000" as unknown as import("@prisma/client/runtime/library").Decimal,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        units: [
          {
            id: "unit-1",
            ingredientId: "ing-created",
            name: "karton (12L)",
            toBaseFactor:
              "12000.0000" as unknown as import("@prisma/client/runtime/library").Decimal,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      const payload = {
        name: "Susu UHT",
        category: "MAIN",
        baseUnit: "ML",
        yieldPercent: 100,
        isPerishable: true,
        minStockBase: 2000,
        purchaseUnits: [{ name: "karton (12L)", toBaseFactor: 12000 }],
      };

      const res = await request(app)
        .post("/api/ingredients")
        .set("Origin", "http://localhost:5173")
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.id).toBe("ing-created");
      expect(ingredientRepository.create).toHaveBeenCalledWith(
        mockBusinessId,
        expect.objectContaining({
          name: "Susu UHT",
          nameKey: "susu uht",
          baseUnit: "ML",
        })
      );
    });

    it("rejects CASHIER from creating ingredients with 403 FORBIDDEN", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(cashierSession);

      const res = await request(app)
        .post("/api/ingredients")
        .set("Origin", "http://localhost:5173")
        .send({
          name: "Susu Segar",
          category: "MAIN",
          baseUnit: "ML",
          yieldPercent: 100,
        });

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("rejects duplicate ingredient name with 409 CONFLICT", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(ingredientRepository.findByNameKey).mockResolvedValueOnce({
        id: "ing-existing",
        name: "Susu UHT",
      } as unknown as import("@prisma/client").Ingredient);

      const res = await request(app)
        .post("/api/ingredients")
        .set("Origin", "http://localhost:5173")
        .send({
          name: "  susu   uht  ",
          category: "MAIN",
          baseUnit: "ML",
          yieldPercent: 100,
        });

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("CONFLICT");
      expect(res.body.error.message).toContain("sudah terdaftar");
    });

    it("validates yield percent range 1..100 with 400 VALIDATION_ERROR", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);

      const res = await request(app)
        .post("/api/ingredients")
        .set("Origin", "http://localhost:5173")
        .send({
          name: "Ayam",
          category: "MAIN",
          baseUnit: "G",
          yieldPercent: 150, // Invalid: > 100
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.fieldErrors?.yieldPercent).toBeDefined();
    });
  });

  describe("PATCH /api/ingredients/:id", () => {
    it("updates ingredient details successfully", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(ingredientRepository.findById).mockResolvedValueOnce({
        id: "ing-1",
        businessId: mockBusinessId,
        name: "Ayam Potong",
        nameKey: "ayam potong",
        baseUnit: "G",
        units: [],
      } as unknown as Awaited<ReturnType<typeof ingredientRepository.findById>>);

      vi.mocked(ingredientRepository.update).mockResolvedValueOnce({
        id: "ing-1",
        businessId: mockBusinessId,
        name: "Ayam Potong Segar",
        nameKey: "ayam potong segar",
        yieldPercent: "75.00" as unknown as import("@prisma/client/runtime/library").Decimal,
        units: [],
      } as unknown as import("@prisma/client").Ingredient);

      const res = await request(app)
        .patch("/api/ingredients/ing-1")
        .set("Origin", "http://localhost:5173")
        .send({
          name: "Ayam Potong Segar",
          yieldPercent: 75,
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(ingredientRepository.update).toHaveBeenCalled();
    });

    it("prevents updating baseUnit if ingredient is already used in batches/recipes", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(ingredientRepository.findById).mockResolvedValueOnce({
        id: "ing-1",
        businessId: mockBusinessId,
        name: "Kopi",
        nameKey: "kopi",
        baseUnit: "G",
        units: [],
      } as unknown as Awaited<ReturnType<typeof ingredientRepository.findById>>);

      // Ingredient is recorded in inventory batch or recipe
      vi.mocked(ingredientRepository.isUsedInBatchesOrRecipes).mockResolvedValueOnce(true);

      const res = await request(app)
        .patch("/api/ingredients/ing-1")
        .set("Origin", "http://localhost:5173")
        .send({
          baseUnit: "ML", // Attempting to change G -> ML
        });

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("CONFLICT");
      expect(res.body.error.message).toContain("tidak dapat diubah");
    });
  });

  describe("DELETE /api/ingredients/:id (Soft Delete)", () => {
    it("rejects deactivation when ingredient is used in active menus", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(ingredientRepository.findById).mockResolvedValueOnce({
        id: "ing-1",
        businessId: mockBusinessId,
        name: "Susu Segar",
        isActive: true,
      } as unknown as Awaited<ReturnType<typeof ingredientRepository.findById>>);

      vi.mocked(ingredientRepository.findActiveMenusUsingIngredient).mockResolvedValueOnce([
        "Kopi Susu Aren",
        "Matcha Latte",
      ]);

      const res = await request(app)
        .delete("/api/ingredients/ing-1")
        .set("Origin", "http://localhost:5173");

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("CONFLICT");
      expect(res.body.error.message).toContain("masih digunakan pada menu aktif");
      expect(res.body.error.message).toContain("Kopi Susu Aren, Matcha Latte");
    });

    it("deactivates ingredient without dropping data", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(ingredientRepository.findById).mockResolvedValueOnce({
        id: "ing-1",
        businessId: mockBusinessId,
        name: "Bahan Lama",
        isActive: true,
      } as unknown as Awaited<ReturnType<typeof ingredientRepository.findById>>);
      vi.mocked(ingredientRepository.findActiveMenusUsingIngredient).mockResolvedValueOnce([]);

      vi.mocked(ingredientRepository.update).mockResolvedValueOnce({
        id: "ing-1",
        isActive: false,
      } as unknown as import("@prisma/client").Ingredient);

      const res = await request(app)
        .delete("/api/ingredients/ing-1")
        .set("Origin", "http://localhost:5173");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(ingredientRepository.update).toHaveBeenCalledWith(mockBusinessId, "ing-1", {
        isActive: false,
      });
    });
  });

  describe("POST & DELETE /api/ingredients/:id/units", () => {
    it("adds a new purchase conversion unit", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(ingredientRepository.findById).mockResolvedValueOnce({
        id: "ing-1",
        name: "Kopi",
        units: [],
      } as unknown as Awaited<ReturnType<typeof ingredientRepository.findById>>);

      vi.mocked(ingredientRepository.addUnit).mockResolvedValueOnce({
        id: "unit-new",
        ingredientId: "ing-1",
        name: "karung (25kg)",
        toBaseFactor: "25000.0000" as unknown as import("@prisma/client/runtime/library").Decimal,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await request(app)
        .post("/api/ingredients/ing-1/units")
        .set("Origin", "http://localhost:5173")
        .send({
          name: "karung (25kg)",
          toBaseFactor: 25000,
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.name).toBe("karung (25kg)");
    });
  });
});
