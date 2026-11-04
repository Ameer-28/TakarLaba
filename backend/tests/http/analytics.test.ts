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

vi.mock("../../src/repositories/dashboard.repo.js", () => ({
  dashboardRepository: {
    getActiveMenusWithRecipes: vi.fn(),
    getCompletedSaleCount: vi.fn(),
    getMenuSalesQuantities: vi.fn(),
  },
  DashboardRepository: vi.fn(),
}));

vi.mock("../../src/repositories/menu.repo.js", () => ({
  menuRepository: {
    getValidStockBatches: vi.fn(),
    getLatestCostPerBaseMap: vi.fn(),
  },
  MenuRepository: vi.fn(),
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
import { dashboardRepository } from "../../src/repositories/dashboard.repo.js";
import { menuRepository } from "../../src/repositories/menu.repo.js";
import { settingsRepository } from "../../src/repositories/settings.repo.js";
import { overheadRepository } from "../../src/repositories/overhead.repo.js";

describe("Analytics Endpoints (GET /api/analytics/capacity) (BR-08, FR-CAP-01)", () => {
  const app = createApp();
  const mockBusinessId = "biz-demo-123";

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
      id: "sess-cashier",
      userId: "user-cashier-1",
      token: "tok-cashier",
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

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
      id: "sess-owner",
      userId: "user-owner-1",
      token: "tok-owner",
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockActiveMenus = [
    {
      id: "menu-kopi-susu",
      name: "Es Kopi Susu Aren",
      category: "BEVERAGE",
      sellingPrice: new Decimal("18000.00"),
      isActive: true,
      recipeItems: [
        {
          ingredientId: "ing-kopi",
          qtyUsableBase: new Decimal("18"),
          ingredient: {
            id: "ing-kopi",
            name: "Biji Kopi",
            baseUnit: "G",
            yieldPercent: new Decimal(100),
          },
        },
        {
          ingredientId: "ing-susu",
          qtyUsableBase: new Decimal("150"),
          ingredient: {
            id: "ing-susu",
            name: "Susu UHT",
            baseUnit: "ML",
            yieldPercent: new Decimal(100),
          },
        },
      ],
    },
    {
      id: "menu-croissant",
      name: "Croissant Polos",
      category: "PASTRY",
      sellingPrice: new Decimal("20000.00"),
      isActive: true,
      recipeItems: [], // No recipe yet
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 UNAUTHENTICATED when unauthenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const res = await request(app).get("/api/analytics/capacity");
    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("returns sanitized DTO for CASHIER without cost fields or items breakdown (Rule 7)", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(cashierSession);
    vi.mocked(dashboardRepository.getActiveMenusWithRecipes).mockResolvedValue(
      mockActiveMenus as never
    );
    // Stock: Kopi 180g (10 portions), Susu 750ml (5 portions) -> Bottleneck is Susu (5 portions)
    vi.mocked(menuRepository.getValidStockBatches).mockResolvedValue([
      {
        ingredientId: "ing-kopi",
        remainingQtyBase: new Decimal("180"),
        expiryDate: null,
      },
      {
        ingredientId: "ing-susu",
        remainingQtyBase: new Decimal("750"),
        expiryDate: null,
      },
    ] as never);

    const res = await request(app).get("/api/analytics/capacity");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const items = res.body.data;
    expect(items).toHaveLength(2);

    const kopiSusu = items.find((i: { id: string }) => i.id === "menu-kopi-susu");
    expect(kopiSusu).toBeDefined();
    expect(kopiSusu.name).toBe("Es Kopi Susu Aren");
    expect(kopiSusu.sellingPrice).toBe("18000.00");
    expect(kopiSusu.capacity).toBe(5);
    expect(kopiSusu.bottleneckIngredientName).toBe("Susu UHT");
    expect(kopiSusu.hasRecipe).toBe(true);

    // CASHIER must NOT see internal items breakdown or bottleneck object with stock amounts
    expect(kopiSusu.bottleneck).toBeUndefined();
    expect(kopiSusu.items).toBeUndefined();
    expect(kopiSusu.costSummary).toBeUndefined();
    expect(kopiSusu.hppBahan).toBeUndefined();

    // Menu without recipe
    const croissant = items.find((i: { id: string }) => i.id === "menu-croissant");
    expect(croissant.capacity).toBe(0);
    expect(croissant.hasRecipe).toBe(false);
    expect(croissant.bottleneckIngredientName).toBeNull();
  });

  it("returns full capacity breakdown with bottleneck details for OWNER", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
    vi.mocked(dashboardRepository.getActiveMenusWithRecipes).mockResolvedValue(
      mockActiveMenus as never
    );
    vi.mocked(menuRepository.getValidStockBatches).mockResolvedValue([
      {
        ingredientId: "ing-kopi",
        remainingQtyBase: new Decimal("180"),
        expiryDate: null,
      },
      {
        ingredientId: "ing-susu",
        remainingQtyBase: new Decimal("750"),
        expiryDate: null,
      },
    ] as never);

    const res = await request(app).get("/api/analytics/capacity");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const kopiSusu = res.body.data.find((i: { id: string }) => i.id === "menu-kopi-susu");
    expect(kopiSusu).toBeDefined();
    expect(kopiSusu.capacity).toBe(5);
    expect(kopiSusu.bottleneckIngredientName).toBe("Susu UHT");
    expect(kopiSusu.bottleneck).toEqual({
      ingredientId: "ing-susu",
      ingredientName: "Susu UHT",
      baseUnit: "ML",
      validStockBase: "750.000",
      rawPerPortion: "150.000",
      maxPortions: 5,
    });
    expect(kopiSusu.items).toHaveLength(2);
    expect(kopiSusu.items[0].ingredientName).toBe("Biji Kopi");
    expect(kopiSusu.items[0].maxPortions).toBe(10);
    expect(kopiSusu.items[1].ingredientName).toBe("Susu UHT");
    expect(kopiSusu.items[1].maxPortions).toBe(5);
  });

  describe("Menu Engineering Matrix (GET /api/analytics/menu-engineering) (BR-10, FR-MEG-01)", () => {
    it("returns 401 UNAUTHENTICATED when unauthenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const res = await request(app).get("/api/analytics/menu-engineering");
      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHENTICATED");
    });

    it("returns 403 FORBIDDEN for CASHIER role", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(cashierSession);

      const res = await request(app).get("/api/analytics/menu-engineering");
      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 200 and evaluated Menu Engineering matrix for OWNER", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);

      // Business settings: expected 1300 portions, rounding 500
      vi.mocked(settingsRepository.findById).mockResolvedValue({
        id: mockBusinessId,
        name: "Demo Cafe",
        expectedMonthlyPortions: 1300,
        priceRoundingStep: 500,
        targetMarginDefault: new Decimal("50.00"),
        expiryWarnDays: 3,
        isDemo: true,
        demoResetAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Overhead: Rp1.560.000 / 1300 = Rp1.200 per portion
      vi.mocked(overheadRepository.sumActiveMonthlyOverhead).mockResolvedValue(
        new Decimal("1560000")
      );

      // 4 active menus
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      vi.mocked(dashboardRepository.getActiveMenusWithRecipes).mockResolvedValue([
        {
          id: "m-1",
          name: "Menu Star 1",
          category: "Coffee",
          sellingPrice: new Decimal("20000.00"),
          createdAt: pastDate,
          recipeItems: [
            {
              ingredientId: "ing-1",
              qtyUsableBase: new Decimal("10"),
              ingredient: {
                id: "ing-1",
                name: "Bahan 1",
                baseUnit: "G",
                yieldPercent: new Decimal(100),
              },
            },
          ],
        },
        {
          id: "m-2",
          name: "Menu Star 2",
          category: "Coffee",
          sellingPrice: new Decimal("18000.00"),
          createdAt: pastDate,
          recipeItems: [
            {
              ingredientId: "ing-1",
              qtyUsableBase: new Decimal("10"),
              ingredient: {
                id: "ing-1",
                name: "Bahan 1",
                baseUnit: "G",
                yieldPercent: new Decimal(100),
              },
            },
          ],
        },
        {
          id: "m-3",
          name: "Menu Plowhorse",
          category: "Non-Coffee",
          sellingPrice: new Decimal("12000.00"),
          createdAt: pastDate,
          recipeItems: [
            {
              ingredientId: "ing-1",
              qtyUsableBase: new Decimal("10"),
              ingredient: {
                id: "ing-1",
                name: "Bahan 1",
                baseUnit: "G",
                yieldPercent: new Decimal(100),
              },
            },
          ],
        },
        {
          id: "m-4",
          name: "Menu Puzzle",
          category: "Non-Coffee",
          sellingPrice: new Decimal("25000.00"),
          createdAt: pastDate,
          recipeItems: [
            {
              ingredientId: "ing-1",
              qtyUsableBase: new Decimal("10"),
              ingredient: {
                id: "ing-1",
                name: "Bahan 1",
                baseUnit: "G",
                yieldPercent: new Decimal(100),
              },
            },
          ],
        },
      ] as never);

      // Cost map: Bahan 1 @ Rp200/G -> 10G * 200 = 2000 HPP Bahan + 1200 ovh = 3200 HPP Penuh
      vi.mocked(menuRepository.getLatestCostPerBaseMap).mockResolvedValue(
        new Map([["ing-1", new Decimal("200")]])
      );

      vi.mocked(menuRepository.getValidStockBatches).mockResolvedValue([]);

      // 100 transactions, portions: m1=100, m2=100, m3=100, m4=10
      vi.mocked(dashboardRepository.getCompletedSaleCount).mockResolvedValue(100);
      vi.mocked(dashboardRepository.getMenuSalesQuantities).mockResolvedValue([
        { menuId: "m-1", _sum: { qty: 100 } },
        { menuId: "m-2", _sum: { qty: 100 } },
        { menuId: "m-3", _sum: { qty: 100 } },
        { menuId: "m-4", _sum: { qty: 10 } },
      ]);

      const res = await request(app).get("/api/analytics/menu-engineering?days=30");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const data = res.body.data;
      expect(data.isDataSufficient).toBe(true);
      expect(data.days).toBe(30);
      expect(data.totalTransactions).toBe(100);
      expect(data.totalClassifiedPortions).toBe(310);
      expect(data.classifiedMenus).toHaveLength(4);
    });
  });
});
