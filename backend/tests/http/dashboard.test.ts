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
    getBusinessSettings: vi.fn(),
    getTodaySalesAggregate: vi.fn(),
    getRecentSales: vi.fn(),
    getOpenAlertCount: vi.fn(),
    getTopAlerts: vi.fn(),
    getExpiringBatches: vi.fn(),
    getActiveIngredientsWithBatches: vi.fn(),
    getActiveMenusWithRecipes: vi.fn(),
    getCounts: vi.fn(),
  },
  DashboardRepository: vi.fn(),
}));

import { auth } from "../../src/lib/auth.js";
import { dashboardRepository } from "../../src/repositories/dashboard.repo.js";

describe("Dashboard Routes (T-053 — AC: FR-DASH-01)", () => {
  const app = createApp();
  const mockBusinessId = "biz-demo-123";
  const mockOwnerId = "user-owner-1";

  const ownerSession = {
    user: {
      id: mockOwnerId,
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
      userId: mockOwnerId,
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
      name: "Kasir 1",
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

  it("rejects unauthenticated requests with 401", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

    const res = await request(app).get("/api/dashboard/summary");

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("rejects CASHIER requests with 403 Forbidden (Cashier confidentiality Rule 7)", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(cashierSession);

    const res = await request(app).get("/api/dashboard/summary");

    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("returns dashboard summary data successfully for OWNER", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);

    vi.mocked(dashboardRepository.getBusinessSettings).mockResolvedValueOnce({
      id: mockBusinessId,
      name: "TakarLaba Cafe",
      targetMarginDefault: new Decimal("50.00"),
      expiryWarnDays: 3,
      priceRoundingStep: 500,
    });

    vi.mocked(dashboardRepository.getTodaySalesAggregate).mockResolvedValueOnce({
      _sum: {
        totalAmount: new Decimal("150000.00"),
        totalIngredientCost: new Decimal("60000.00"),
        totalOverhead: new Decimal("15000.00"),
      },
      _count: {
        id: 8,
      },
    });

    vi.mocked(dashboardRepository.getRecentSales).mockResolvedValueOnce([
      {
        id: "sale-1",
        businessId: mockBusinessId,
        invoiceNo: "INV-20261031-0001",
        idempotencyKey: "idem-1",
        soldAt: new Date("2026-10-31T10:00:00.000Z"),
        cashierId: "c1",
        paymentMethod: "QRIS",
        totalAmount: new Decimal("36000.00"),
        totalIngredientCost: new Decimal("15000.00"),
        totalOverhead: new Decimal("3000.00"),
        status: "COMPLETED",
        voidedAt: null,
        voidReason: null,
        voidedById: null,
        createdAt: new Date("2026-10-31T10:00:00.000Z"),
        cashier: { id: "c1", name: "Kasir 1" },
        items: [{ qty: 2 }],
      },
    ]);

    vi.mocked(dashboardRepository.getOpenAlertCount).mockResolvedValueOnce(1);

    vi.mocked(dashboardRepository.getTopAlerts).mockResolvedValueOnce([
      {
        id: "alert-1",
        businessId: mockBusinessId,
        menuId: "menu-1",
        menu: {
          id: "menu-1",
          name: "Es Kopi Susu Aren",
          category: "Coffee",
          sellingPrice: new Decimal("18000.00"),
        },
        triggerIngredientId: "ing-susu",
        triggerPurchaseId: "pur-1",
        triggerIngredient: {
          id: "ing-susu",
          name: "Susu UHT",
          baseUnit: "ml",
        },
        status: "OPEN",
        resolution: null,
        resolvedAt: null,
        resolvedById: null,
        sellingPriceAtTrigger: new Decimal("18000.00"),
        recommendedPrice: new Decimal("20000.00"),
        marginBeforePct: new Decimal("50.3"),
        marginAfterPct: new Decimal("45.3"),
        targetPct: new Decimal("50.0"),
        ingredientCostBefore: new Decimal("7740.00"),
        ingredientCostAfter: new Decimal("8640.00"),
        fullCostBefore: new Decimal("8940.00"),
        fullCostAfter: new Decimal("9840.00"),
        note: null,
        createdAt: new Date("2026-10-31T08:00:00.000Z"),
        updatedAt: new Date("2026-10-31T08:00:00.000Z"),
      },
    ]);

    vi.mocked(dashboardRepository.getExpiringBatches).mockResolvedValueOnce([
      {
        id: "batch-1",
        remainingQtyBase: new Decimal("5000"),
        costPerBase: new Decimal("20"),
        expiryDate: new Date("2026-11-02"),
      },
    ]);

    vi.mocked(dashboardRepository.getActiveIngredientsWithBatches).mockResolvedValueOnce([
      {
        id: "ing-susu",
        businessId: mockBusinessId,
        name: "Susu UHT",
        nameKey: "susu-uht",
        category: "DAIRY",
        baseUnit: "ml",
        yieldPercent: new Decimal("100"),
        isPerishable: true,
        minStockBase: new Decimal("3000"),
        createdAt: new Date(),
        updatedAt: new Date(),
        stockBatches: [
          {
            id: "b1",
            remainingQtyBase: new Decimal("1500"),
            costPerBase: new Decimal("20"),
            expiryDate: new Date("2026-11-02"),
          },
        ],
      },
      {
        id: "ing-kopi",
        businessId: mockBusinessId,
        name: "Biji Kopi",
        nameKey: "biji-kopi",
        category: "COFFEE",
        baseUnit: "g",
        yieldPercent: new Decimal("100"),
        isPerishable: false,
        minStockBase: new Decimal("500"),
        createdAt: new Date(),
        updatedAt: new Date(),
        stockBatches: [
          {
            id: "b2",
            remainingQtyBase: new Decimal("1000"),
            costPerBase: new Decimal("100"),
            expiryDate: null,
          },
        ],
      },
    ]);

    vi.mocked(dashboardRepository.getActiveMenusWithRecipes).mockResolvedValueOnce([
      {
        id: "menu-1",
        businessId: mockBusinessId,
        name: "Es Kopi Susu Aren",
        nameKey: "es-kopi-susu-aren",
        category: "Coffee",
        sellingPrice: new Decimal("18000.00"),
        targetMargin: new Decimal("50.00"),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        recipeItems: [
          {
            id: "r1",
            menuId: "menu-1",
            ingredientId: "ing-susu",
            qtyUsableBase: new Decimal("150"),
            createdAt: new Date(),
            ingredient: {
              id: "ing-susu",
              name: "Susu UHT",
              baseUnit: "ml",
              yieldPercent: new Decimal("100"),
            },
          },
          {
            id: "r2",
            menuId: "menu-1",
            ingredientId: "ing-kopi",
            qtyUsableBase: new Decimal("15"),
            createdAt: new Date(),
            ingredient: {
              id: "ing-kopi",
              name: "Biji Kopi",
              baseUnit: "g",
              yieldPercent: new Decimal("100"),
            },
          },
        ],
      },
    ]);

    vi.mocked(dashboardRepository.getCounts).mockResolvedValueOnce({
      menuCount: 1,
      ingredientCount: 2,
      saleCount: 8,
    });

    const res = await request(app).get("/api/dashboard/summary");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const data = res.body.data;
    // Omzet: 150000.00
    expect(data.summary.omzet).toBe("150000.00");
    expect(data.summary.transactionCount).toBe(8);
    // Estimated profit = 150000 - 60000 - 15000 = 75000.00
    expect(data.summary.estimatedProfit).toBe("75000.00");
    // Average margin percent = (75000 / 150000) * 100 = 50.0%
    expect(data.summary.averageMarginPercent).toBe("50.0");
    // Open alert count = 1
    expect(data.summary.openAlertCount).toBe(1);
    // Expiring stock value = 5000 * 20 = 100000.00
    expect(data.summary.expiringStockValue).toBe("100000.00");
    // Low stock count: Susu valid is 1500 <= minStock 3000 -> 1 low stock
    expect(data.summary.lowStockCount).toBe(1);
    expect(data.summary.targetMargin).toBe("50.0");

    // Top alerts
    expect(data.topAlerts).toHaveLength(1);
    expect(data.topAlerts[0].menuName).toBe("Es Kopi Susu Aren");
    expect(data.topAlerts[0].recommendedPrice).toBe("20000.00");

    // Lowest capacity menus:
    // Susu: 1500 / 150 = 10 portions
    // Kopi: 1000 / 15 = 66 portions
    // Capacity = 10, bottleneck = Susu UHT
    expect(data.lowestCapacityMenus).toHaveLength(1);
    expect(data.lowestCapacityMenus[0].name).toBe("Es Kopi Susu Aren");
    expect(data.lowestCapacityMenus[0].capacity).toBe(10);
    expect(data.lowestCapacityMenus[0].bottleneckIngredient?.name).toBe("Susu UHT");

    // Recent sales
    expect(data.recentSales).toHaveLength(1);
    expect(data.recentSales[0].invoiceNo).toBe("INV-20261031-0001");
    expect(data.recentSales[0].totalAmount).toBe("36000.00");

    expect(data.isNewBusiness).toBe(false);
  });

  it("handles new business with zero transactions and empty catalog gracefully", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);

    vi.mocked(dashboardRepository.getBusinessSettings).mockResolvedValueOnce({
      id: mockBusinessId,
      name: "TakarLaba Baru",
      targetMarginDefault: new Decimal("50.00"),
      expiryWarnDays: 3,
      priceRoundingStep: 500,
    });

    vi.mocked(dashboardRepository.getTodaySalesAggregate).mockResolvedValueOnce({
      _sum: {
        totalAmount: null,
        totalIngredientCost: null,
        totalOverhead: null,
      },
      _count: {
        id: 0,
      },
    });

    vi.mocked(dashboardRepository.getRecentSales).mockResolvedValueOnce([]);
    vi.mocked(dashboardRepository.getOpenAlertCount).mockResolvedValueOnce(0);
    vi.mocked(dashboardRepository.getTopAlerts).mockResolvedValueOnce([]);
    vi.mocked(dashboardRepository.getExpiringBatches).mockResolvedValueOnce([]);
    vi.mocked(dashboardRepository.getActiveIngredientsWithBatches).mockResolvedValueOnce([]);
    vi.mocked(dashboardRepository.getActiveMenusWithRecipes).mockResolvedValueOnce([]);
    vi.mocked(dashboardRepository.getCounts).mockResolvedValueOnce({
      menuCount: 0,
      ingredientCount: 0,
      saleCount: 0,
    });

    const res = await request(app).get("/api/dashboard/summary");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const data = res.body.data;
    expect(data.summary.omzet).toBe("0.00");
    expect(data.summary.transactionCount).toBe(0);
    expect(data.summary.estimatedProfit).toBe("0.00");
    expect(data.summary.averageMarginPercent).toBe("0.0");
    expect(data.summary.openAlertCount).toBe(0);
    expect(data.summary.expiringStockValue).toBe("0.00");
    expect(data.summary.lowStockCount).toBe(0);
    expect(data.lowestCapacityMenus).toEqual([]);
    expect(data.topAlerts).toEqual([]);
    expect(data.recentSales).toEqual([]);
    expect(data.isNewBusiness).toBe(true);
  });
});
