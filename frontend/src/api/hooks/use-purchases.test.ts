import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../client.js";

describe("Purchase API client integration", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends POST /api/purchases to create multi-row purchase", async () => {
    const payload = {
      supplierName: "Toko Berkah",
      note: "Belanja mingguan",
      items: [
        {
          ingredientId: "ing-1",
          purchaseQty: 5,
          purchaseUnit: "kg",
          purchaseUnitPrice: 25000,
        },
      ],
    };

    const mockResponse = {
      id: "purch-123",
      totalAmount: 125000,
      batches: [],
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 201,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockResponse })),
    } as unknown as Response);

    const result = await apiClient("/purchases", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    expect(result).toEqual(mockResponse);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/purchases",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  });

  it("sends GET /api/purchases with pagination and filters", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: [] })),
    } as unknown as Response);

    const result = await apiClient("/purchases", {
      params: { page: 1, limit: 10, supplier: "Toko" },
    });

    expect(result).toEqual([]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/purchases?page=1&limit=10&supplier=Toko"),
      expect.objectContaining({ credentials: "same-origin" })
    );
  });
});
