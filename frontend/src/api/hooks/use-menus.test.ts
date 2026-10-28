import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../client.js";

describe("Menu API client integration", () => {
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
});
