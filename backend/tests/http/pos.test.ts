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

vi.mock("../../src/repositories/menu.repo.js", () => ({
  menuRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    findPosMenus: vi.fn(),
    getValidStockBatches: vi.fn(),
  },
  MenuRepository: vi.fn(),
}));

import { auth } from "../../src/lib/auth.js";
import { menuRepository } from "../../src/repositories/menu.repo.js";

describe("POS Menus Endpoint & DTO Allowlist (AC: FR-POS-01, Rule 7)", () => {
  const app = createApp();
  const mockBusinessId = "biz-demo-123";

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated GET /api/pos/menus with 401 UNAUTHENTICATED", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

    const res = await request(app).get("/api/pos/menus");

    expect(res.status).toBe(401);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("allows CASHIER role on GET /api/pos/menus with EXACT allowlist DTO (no cost/HPP/margin)", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(cashierSession);

    // Mock active sellable menus with recipes
    vi.mocked(menuRepository.findPosMenus).mockResolvedValueOnce([
      {
        id: "menu-kopi",
        name: "Es Kopi Susu",
        category: "Coffee",
        sellingPrice: new Decimal("18000.00"),
        recipeItems: [
          {
            ingredientId: "ing-susu",
            qtyUsableBase: new Decimal("150"),
            ingredient: {
              id: "ing-susu",
              name: "Susu UHT",
              baseUnit: "ml" as unknown as "ML",
              yieldPercent: new Decimal("100"),
            },
          },
        ],
      },
    ]);

    // Mock stock batches: 1500 ml susu valid -> capacity 10 portions
    vi.mocked(menuRepository.getValidStockBatches).mockResolvedValueOnce([
      {
        ingredientId: "ing-susu",
        remainingQtyBase: new Decimal("1500"),
        expiryDate: new Date("2026-11-15"),
      },
    ]);

    const res = await request(app).get("/api/pos/menus");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveLength(1);

    const item = res.body.data[0] as Record<string, unknown>;

    // Verify EXACT DTO allowlist keys
    const allowedKeys = [
      "bottleneckIngredientName",
      "capacity",
      "category",
      "hasRecipe",
      "id",
      "name",
      "sellingPrice",
    ];
    expect(Object.keys(item).sort()).toEqual(allowedKeys);

    // Verify data values
    expect(item.id).toBe("menu-kopi");
    expect(item.name).toBe("Es Kopi Susu");
    expect(item.category).toBe("Coffee");
    expect(item.sellingPrice).toBe("18000.00");
    expect(item.hasRecipe).toBe(true);
    expect(item.capacity).toBe(10);
    expect(item.bottleneckIngredientName).toBe("Susu UHT");

    // Strictly verify no cost fields leaked
    expect(item.hppBahan).toBeUndefined();
    expect(item.hppPenuh).toBeUndefined();
    expect(item.costSummary).toBeUndefined();
    expect(item.margin).toBeUndefined();
    expect(item.targetMargin).toBeUndefined();
    expect(item.overhead).toBeUndefined();
    expect(item.costPerBase).toBeUndefined();
  });

  it("allows OWNER role on GET /api/pos/menus with same allowlist DTO", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);

    vi.mocked(menuRepository.findPosMenus).mockResolvedValueOnce([]);
    vi.mocked(menuRepository.getValidStockBatches).mockResolvedValueOnce([]);

    const res = await request(app).get("/api/pos/menus");

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toEqual([]);
  });

  it("rejects CASHIER role on GET /api/menus with 403 FORBIDDEN", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValueOnce(cashierSession);

    const res = await request(app).get("/api/menus");

    expect(res.status).toBe(403);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});
