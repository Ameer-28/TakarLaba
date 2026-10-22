import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../client.js";

describe("Ingredient API client integration", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends GET /api/ingredients with query parameters", async () => {
    const mockData = [
      {
        id: "ing-1",
        name: "Kopi",
        category: "MAIN",
        baseUnit: "G",
        yieldPercent: 100,
        isPerishable: false,
        minStockBase: 500,
        isActive: true,
        units: [],
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockData })),
    } as unknown as Response);

    const result = await apiClient("/ingredients", {
      params: { search: "kopi", category: "MAIN", isActive: true },
    });

    expect(result).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/ingredients?search=kopi&category=MAIN&isActive=true"),
      expect.objectContaining({ credentials: "same-origin" })
    );
  });

  it("sends POST /api/ingredients to create an ingredient with units", async () => {
    const payload = {
      name: "Susu UHT",
      category: "MAIN",
      baseUnit: "ML",
      yieldPercent: 100,
      isPerishable: true,
      minStockBase: 1000,
      purchaseUnits: [{ name: "karton", toBaseFactor: 12000 }],
    };

    const mockCreated = { id: "ing-susu", ...payload, isActive: true };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 201,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockCreated })),
    } as unknown as Response);

    const result = await apiClient("/ingredients", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    expect(result).toEqual(mockCreated);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/ingredients",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  });

  it("sends DELETE /api/ingredients/:id for soft-delete", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi
        .fn()
        .mockResolvedValueOnce(
          JSON.stringify({ ok: true, data: { id: "ing-1", isActive: false } })
        ),
    } as unknown as Response);

    const result = await apiClient("/ingredients/ing-1", {
      method: "DELETE",
    });

    expect(result).toEqual({ id: "ing-1", isActive: false });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/ingredients/ing-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
