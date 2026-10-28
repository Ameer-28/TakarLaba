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

vi.mock("../../src/repositories/menu.repo.js", () => ({
  menuRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    findByNameKey: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    countSales: vi.fn(),
  },
  MenuRepository: vi.fn(),
}));

import { auth } from "../../src/lib/auth.js";
import { menuRepository } from "../../src/repositories/menu.repo.js";

describe("Menu CRUD Routes (T-031)", () => {
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
});
