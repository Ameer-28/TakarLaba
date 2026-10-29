import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../client.js";
import type { MenuItem } from "./use-menus.js";

describe("Menu & Recipe Costing API client integration (T-031 / T-033)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends GET /api/menus with search and category params", async () => {
    const mockMenus = [
      {
        id: "menu-1",
        businessId: "biz-1",
        name: "Kopi Susu Gula Aren",
        nameKey: "kopi susu gula aren",
        category: "Minuman",
        sellingPrice: "18000.00",
        targetMargin: "60.00",
        isActive: true,
        hasRecipe: true,
        recipeItemsCount: 3,
        saleItemsCount: 0,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockMenus })),
    } as unknown as Response);

    const result = await apiClient("/menus", {
      params: { search: "kopi", category: "Minuman", isActive: true },
    });

    expect(result).toEqual(mockMenus);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/menus?search=kopi&category=Minuman&isActive=true"),
      expect.objectContaining({ credentials: "same-origin" })
    );
  });

  it("sends POST /api/menus to create a menu", async () => {
    const payload = {
      name: "Roti Panggang",
      category: "Makanan",
      sellingPrice: 15000,
      targetMargin: 50,
    };

    const mockCreated = {
      id: "menu-2",
      businessId: "biz-1",
      name: "Roti Panggang",
      nameKey: "roti panggang",
      category: "Makanan",
      sellingPrice: "15000.00",
      targetMargin: "50.00",
      isActive: true,
      hasRecipe: false,
      recipeItemsCount: 0,
      saleItemsCount: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 201,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockCreated })),
    } as unknown as Response);

    const result = await apiClient("/menus", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    expect(result).toEqual(mockCreated);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/menus",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  });

  it("sends PATCH /api/menus/:id to update a menu", async () => {
    const updatePayload = {
      sellingPrice: 20000,
    };

    const mockUpdated = {
      id: "menu-1",
      businessId: "biz-1",
      name: "Kopi Susu",
      nameKey: "kopi susu",
      category: "Minuman",
      sellingPrice: "20000.00",
      targetMargin: "60.00",
      isActive: true,
      hasRecipe: true,
      recipeItemsCount: 2,
      saleItemsCount: 0,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockUpdated })),
    } as unknown as Response);

    const result = await apiClient("/menus/menu-1", {
      method: "PATCH",
      body: JSON.stringify(updatePayload),
    });

    expect(result).toEqual(mockUpdated);
  });

  it("sends DELETE /api/menus/:id to delete an unused menu", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: { id: "menu-1" } })),
    } as unknown as Response);

    const result = await apiClient("/menus/menu-1", {
      method: "DELETE",
    });

    expect(result).toEqual({ id: "menu-1" });
  });

  it("sends POST /api/menus/preview-cost to calculate live HPP", async () => {
    const payload = {
      sellingPrice: 18000,
      targetMargin: 50,
      items: [
        { ingredientId: "ing-1", qtyUsable: 18 },
        { ingredientId: "ing-2", qtyUsable: 150 },
      ],
    };

    const mockPreview = {
      hppBahan: "7740.00",
      overheadPerPortion: "1200.00",
      hppPenuh: "8940.00",
      sellingPrice: "18000.00",
      marginKontribusi: "9060.00",
      marginPercent: "50.33",
      marginBahanPercent: "57.00",
      marginStatus: "AMAN",
      isCostComplete: true,
      items: [],
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockPreview })),
    } as unknown as Response);

    const result = await apiClient("/menus/preview-cost", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    expect(result).toEqual(mockPreview);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/menus/preview-cost",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  });

  it("sends PUT /api/menus/:id/recipe to save recipe items", async () => {
    const payload = {
      items: [
        { ingredientId: "ing-1", qtyUsable: 18 },
        { ingredientId: "ing-2", qtyUsable: 150 },
      ],
    };

    const mockDetail = {
      id: "menu-1",
      businessId: "biz-1",
      name: "Es Kopi Susu",
      nameKey: "es kopi susu",
      category: "Minuman",
      sellingPrice: "18000.00",
      targetMargin: "50.00",
      isActive: true,
      hasRecipe: true,
      recipeItemsCount: 2,
      saleItemsCount: 0,
      recipeItems: [],
      priceHistories: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockDetail })),
    } as unknown as Response);

    const result = await apiClient("/menus/menu-1/recipe", {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    expect(result).toEqual(mockDetail);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/menus/menu-1/recipe",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(payload),
      })
    );
  });

  it("handles menus with costSummary and marginStatus (BR-09, FR-COST-01)", async () => {
    const mockMenusWithCost = [
      {
        id: "menu-hero",
        businessId: "biz-1",
        name: "Es Kopi Susu Aren",
        nameKey: "es kopi susu aren",
        category: "Minuman",
        sellingPrice: "18000.00",
        targetMargin: "50.00",
        isActive: true,
        hasRecipe: true,
        recipeItemsCount: 3,
        saleItemsCount: 12,
        costSummary: {
          hppBahan: "7740.00",
          overheadPerPortion: "1200.00",
          hppPenuh: "8940.00",
          sellingPrice: "18000.00",
          marginKontribusi: "9060.00",
          marginPercent: "50.33",
          marginBahanPercent: "57.00",
          marginStatus: "AMAN" as const,
          isCostComplete: true,
          missingCostIngredients: [],
        },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "menu-incomplete",
        businessId: "biz-1",
        name: "Matcha Latte",
        nameKey: "matcha latte",
        category: "Minuman",
        sellingPrice: "22000.00",
        targetMargin: "50.00",
        isActive: true,
        hasRecipe: true,
        recipeItemsCount: 2,
        saleItemsCount: 0,
        costSummary: {
          hppBahan: null,
          overheadPerPortion: "1200.00",
          hppPenuh: null,
          sellingPrice: "22000.00",
          marginKontribusi: null,
          marginPercent: null,
          marginBahanPercent: null,
          marginStatus: "INCOMPLETE" as const,
          isCostComplete: false,
          missingCostIngredients: ["Bubuk Matcha"],
        },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockMenusWithCost })),
    } as unknown as Response);

    const result = await apiClient<MenuItem[]>("/menus");

    expect(result).toEqual(mockMenusWithCost);
    expect(result[0]!.costSummary?.marginStatus).toBe("AMAN");
    expect(result[0]!.costSummary?.hppPenuh).toBe("8940.00");
    expect(result[1]!.costSummary?.isCostComplete).toBe(false);
    expect(result[1]!.costSummary?.marginStatus).toBe("INCOMPLETE");
    expect(result[1]!.costSummary?.missingCostIngredients).toContain("Bubuk Matcha");
  });
});
