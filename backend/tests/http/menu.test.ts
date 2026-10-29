import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { Decimal } from "decimal.js";
import { createApp } from "../../src/create-app.js";

vi.mock("../../src/lib/auth.js", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("../../src/repositories/menu.repo.js", () => ({
  menuRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    findByNameKey: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countSales: vi.fn(),
    saveRecipe: vi.fn(),
    getLatestCostPerBaseMap: vi.fn(),
  },
  MenuRepository: vi.fn(),
}));

vi.mock("../../src/repositories/ingredient.repo.js", () => ({
  ingredientRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
  },
  IngredientRepository: vi.fn(),
}));

vi.mock("../../src/repositories/settings.repo.js", () => ({
  settingsRepository: {
    findById: vi.fn(),
  },
  SettingsRepository: vi.fn(),
}));

vi.mock("../../src/repositories/overhead.repo.js", () => ({
  overheadRepository: {
    sumActiveMonthlyOverhead: vi.fn(),
  },
  OverheadRepository: vi.fn(),
}));

import { auth } from "../../src/lib/auth.js";
import { menuRepository } from "../../src/repositories/menu.repo.js";
import { ingredientRepository } from "../../src/repositories/ingredient.repo.js";
import { settingsRepository } from "../../src/repositories/settings.repo.js";
import { overheadRepository } from "../../src/repositories/overhead.repo.js";

describe("Menu CRUD & Recipe Costing Routes (T-031 / T-033)", () => {
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
      email: "cashier@demo.id",
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

  it("GET /api/menus returns list of menus for OWNER", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
    const mockMenus = [
      {
        id: "menu-1",
        businessId: mockBusinessId,
        name: "Kopi Susu Gula Aren",
        nameKey: "kopi susu gula aren",
        category: "Minuman",
        sellingPrice: "18000.00",
        targetMargin: "60.00",
        isActive: true,
        hasRecipe: true,
        recipeItemsCount: 3,
        saleItemsCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    vi.mocked(menuRepository.findMany).mockResolvedValue(mockMenus);

    const res = await request(app).get("/api/menus");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Kopi Susu Gula Aren");
    expect(menuRepository.findMany).toHaveBeenCalledWith(mockBusinessId, {
      category: undefined,
      isActive: undefined,
      search: undefined,
    });
  });

  it("GET /api/menus forbids CASHIER with 403", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(cashierSession);

    const res = await request(app).get("/api/menus");
    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("POST /api/menus creates menu successfully for OWNER", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
    vi.mocked(menuRepository.findByNameKey).mockResolvedValue(null);
    vi.mocked(menuRepository.create).mockResolvedValue({
      id: "menu-new",
      businessId: mockBusinessId,
      name: "Roti Bakar Cokelat",
      nameKey: "roti bakar cokelat",
      category: "Makanan",
      sellingPrice: "15000.00",
      targetMargin: "50.00",
      isActive: true,
      hasRecipe: false,
      recipeItemsCount: 0,
      saleItemsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app).post("/api/menus").send({
      name: "Roti Bakar Cokelat",
      category: "Makanan",
      sellingPrice: "15000",
      targetMargin: "50",
    });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.name).toBe("Roti Bakar Cokelat");
    expect(res.body.data.sellingPrice).toBe("15000.00");
  });

  it("POST /api/menus validates invalid selling price and empty name", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);

    const res = await request(app).post("/api/menus").send({
      name: "A", // too short
      sellingPrice: -5000, // negative price
    });

    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/menus rejects duplicate menu name within same business", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
    vi.mocked(menuRepository.findByNameKey).mockResolvedValue({
      id: "menu-existing",
      businessId: mockBusinessId,
      name: "Kopi Hitam",
      nameKey: "kopi hitam",
      category: "Minuman",
      sellingPrice: "10000.00",
      targetMargin: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app).post("/api/menus").send({
      name: "  kopi   hitam  ",
      sellingPrice: "12000",
    });

    expect(res.status).toBe(409);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("PATCH /api/menus/:id updates price and logs price history", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
    vi.mocked(menuRepository.findById).mockResolvedValue({
      id: "menu-1",
      businessId: mockBusinessId,
      name: "Kopi Hitam",
      nameKey: "kopi hitam",
      category: "Minuman",
      sellingPrice: "10000.00",
      targetMargin: "50.00",
      isActive: true,
      hasRecipe: false,
      recipeItemsCount: 0,
      saleItemsCount: 0,
      recipeItems: [],
      priceHistories: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(menuRepository.update).mockResolvedValue({
      id: "menu-1",
      businessId: mockBusinessId,
      name: "Kopi Hitam",
      nameKey: "kopi hitam",
      category: "Minuman",
      sellingPrice: "12000.00",
      targetMargin: "50.00",
      isActive: true,
      hasRecipe: false,
      recipeItemsCount: 0,
      saleItemsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app).patch("/api/menus/menu-1").send({
      sellingPrice: "12000",
    });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(menuRepository.update).toHaveBeenCalledWith(
      mockBusinessId,
      "menu-1",
      expect.objectContaining({ sellingPrice: "12000" }),
      expect.objectContaining({
        oldPrice: "10000.00",
        newPrice: "12000.00",
        reason: "MANUAL",
        changedById: "user-owner-1",
      })
    );
  });

  it("DELETE /api/menus/:id deletes menu without sales history", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
    vi.mocked(menuRepository.findById).mockResolvedValue({
      id: "menu-unused",
      businessId: mockBusinessId,
      name: "Menu Baru",
      nameKey: "menu baru",
      category: null,
      sellingPrice: "20000.00",
      targetMargin: null,
      isActive: true,
      hasRecipe: false,
      recipeItemsCount: 0,
      saleItemsCount: 0,
      recipeItems: [],
      priceHistories: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(menuRepository.countSales).mockResolvedValue(0);
    vi.mocked(menuRepository.delete).mockResolvedValue({ id: "menu-unused" });

    const res = await request(app).delete("/api/menus/menu-unused");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(menuRepository.delete).toHaveBeenCalledWith(mockBusinessId, "menu-unused");
  });

  it("DELETE /api/menus/:id prevents deletion when menu has sales history", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
    vi.mocked(menuRepository.findById).mockResolvedValue({
      id: "menu-with-sales",
      businessId: mockBusinessId,
      name: "Menu Laris",
      nameKey: "menu laris",
      category: null,
      sellingPrice: "25000.00",
      targetMargin: null,
      isActive: true,
      hasRecipe: true,
      recipeItemsCount: 2,
      saleItemsCount: 15,
      recipeItems: [],
      priceHistories: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(menuRepository.countSales).mockResolvedValue(15);

    const res = await request(app).delete("/api/menus/menu-with-sales");
    expect(res.status).toBe(409);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe("CONFLICT");
    expect(menuRepository.delete).not.toHaveBeenCalled();
  });

  it("GET /api/menus/:id returns 404 when menu is not found", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
    vi.mocked(menuRepository.findById).mockResolvedValue(null);

    const res = await request(app).get("/api/menus/menu-nonexistent");
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  describe("Recipe Costing & Preview (T-033)", () => {
    beforeEach(() => {
      // Setup business settings & overhead:
      // Rp1.560.000 overhead / 1300 portions = Rp1.200
      vi.mocked(settingsRepository.findById).mockResolvedValue({
        id: "settings-1",
        name: "Kafe Demo",
        isDemo: true,
        targetMarginDefault: new Decimal("50.00"),
        priceRoundingStep: 500,
        expectedMonthlyPortions: 1300,
        expiryWarnDays: 3,
        wastePromoMinMargin: new Decimal("30.00"),
        timezone: "Asia/Jakarta",
        createdAt: new Date(),
      });

      vi.mocked(overheadRepository.sumActiveMonthlyOverhead).mockResolvedValue(
        new Decimal("1560000.00")
      );
    });

    it("POST /api/menus/preview-cost calculates live HPP and margin for draft recipe", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);

      // Ingredients in the recipe
      vi.mocked(ingredientRepository.findMany).mockResolvedValue([
        {
          id: "ing-kopi",
          businessId: mockBusinessId,
          name: "Biji Kopi",
          nameKey: "biji kopi",
          category: "MAIN",
          baseUnit: "G",
          yieldPercent: new Decimal(100),
          isPerishable: false,
          minStockBase: new Decimal(0),
          isActive: true,
          units: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "ing-susu",
          businessId: mockBusinessId,
          name: "Susu UHT",
          nameKey: "susu uht",
          category: "MAIN",
          baseUnit: "ML",
          yieldPercent: new Decimal(100),
          isPerishable: true,
          minStockBase: new Decimal(0),
          isActive: true,
          units: [
            {
              id: "u-liter",
              ingredientId: "ing-susu",
              name: "liter",
              toBaseFactor: new Decimal(1000),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Latest costs (Kopi = Rp180/g, Susu = Rp18/ml)
      const costMap = new Map<string, Decimal>();
      costMap.set("ing-kopi", new Decimal("180.000000"));
      costMap.set("ing-susu", new Decimal("18.000000"));
      vi.mocked(menuRepository.getLatestCostPerBaseMap).mockResolvedValue(costMap);

      const res = await request(app)
        .post("/api/menus/preview-cost")
        .send({
          sellingPrice: 18000,
          targetMargin: 50,
          items: [
            { ingredientId: "ing-kopi", qtyUsable: 18 }, // 18 * 180 = 3240
            { ingredientId: "ing-susu", qtyUsable: 150, unitName: "ML" }, // 150 * 18 = 2700
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      // HPP Bahan = 3240 + 2700 = 5940.00
      expect(res.body.data.hppBahan).toBe("5940.00");
      // Overhead = 1200.00
      expect(res.body.data.overheadPerPortion).toBe("1200.00");
      // HPP Penuh = 5940 + 1200 = 7140.00
      expect(res.body.data.hppPenuh).toBe("7140.00");
      expect(res.body.data.marginStatus).toBe("AMAN");
      expect(res.body.data.isCostComplete).toBe(true);
    });

    it("POST /api/menus/preview-cost rejects duplicate ingredients in draft", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);

      const res = await request(app)
        .post("/api/menus/preview-cost")
        .send({
          items: [
            { ingredientId: "ing-kopi", qtyUsable: 18 },
            { ingredientId: "ing-kopi", qtyUsable: 10 },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("POST /api/menus/preview-cost flags INCOMPLETE when an ingredient has no purchase history", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);

      vi.mocked(ingredientRepository.findMany).mockResolvedValue([
        {
          id: "ing-sirup-baru",
          businessId: mockBusinessId,
          name: "Sirup Pandan",
          nameKey: "sirup pandan",
          category: "SUPPORT",
          baseUnit: "ML",
          yieldPercent: new Decimal(100),
          isPerishable: false,
          minStockBase: new Decimal(0),
          isActive: true,
          units: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // No purchase history found
      vi.mocked(menuRepository.getLatestCostPerBaseMap).mockResolvedValue(new Map());

      const res = await request(app)
        .post("/api/menus/preview-cost")
        .send({
          sellingPrice: 20000,
          items: [{ ingredientId: "ing-sirup-baru", qtyUsable: 20 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.isCostComplete).toBe(false);
      expect(res.body.data.marginStatus).toBe("INCOMPLETE");
      expect(res.body.data.hppBahan).toBeNull();
    });

    it("PUT /api/menus/:id/recipe saves recipe items for menu", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);

      vi.mocked(menuRepository.findById).mockResolvedValue({
        id: "menu-1",
        businessId: mockBusinessId,
        name: "Es Kopi Susu",
        nameKey: "es kopi susu",
        category: "Minuman",
        sellingPrice: "18000.00",
        targetMargin: "50.00",
        isActive: true,
        hasRecipe: true,
        recipeItemsCount: 1,
        saleItemsCount: 0,
        recipeItems: [],
        priceHistories: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(ingredientRepository.findMany).mockResolvedValue([
        {
          id: "ing-kopi",
          businessId: mockBusinessId,
          name: "Biji Kopi",
          nameKey: "biji kopi",
          category: "MAIN",
          baseUnit: "G",
          yieldPercent: new Decimal(100),
          isPerishable: false,
          minStockBase: new Decimal(0),
          isActive: true,
          units: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      vi.mocked(menuRepository.saveRecipe).mockResolvedValue(undefined as never);

      const res = await request(app)
        .put("/api/menus/menu-1/recipe")
        .send({
          items: [{ ingredientId: "ing-kopi", qtyUsable: 18 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(menuRepository.saveRecipe).toHaveBeenCalledWith(
        mockBusinessId,
        "menu-1",
        expect.arrayContaining([
          expect.objectContaining({
            ingredientId: "ing-kopi",
          }),
        ])
      );
    });

    it("PUT /api/menus/:id/recipe rejects inactive ingredients", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);

      vi.mocked(menuRepository.findById).mockResolvedValue({
        id: "menu-1",
        businessId: mockBusinessId,
        name: "Es Kopi Susu",
        nameKey: "es kopi susu",
        category: "Minuman",
        sellingPrice: "18000.00",
        targetMargin: "50.00",
        isActive: true,
        hasRecipe: false,
        recipeItemsCount: 0,
        saleItemsCount: 0,
        recipeItems: [],
        priceHistories: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(ingredientRepository.findMany).mockResolvedValue([
        {
          id: "ing-kopi-lama",
          businessId: mockBusinessId,
          name: "Kopi Nonaktif",
          nameKey: "kopi nonaktif",
          category: "MAIN",
          baseUnit: "G",
          yieldPercent: new Decimal(100),
          isPerishable: false,
          minStockBase: new Decimal(0),
          isActive: false, // inactive!
          units: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const res = await request(app)
        .put("/api/menus/menu-1/recipe")
        .send({
          items: [{ ingredientId: "ing-kopi-lama", qtyUsable: 18 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.message).toContain("nonaktif");
    });
  });
});
