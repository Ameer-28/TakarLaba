import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../client.js";

describe("Inventory API client integration", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends GET /api/inventory/summary with warnDays", async () => {
    const mockSummary = [
      {
        id: "ing-1",
        name: "Susu",
        category: "MAIN",
        baseUnit: "ML",
        minStockBase: 1000,
        validStockBase: 3000,
        expiredStockBase: 0,
        nearestExpiryDate: "2026-10-30",
        status: "AMAN",
        isLowStock: false,
        activeBatchCount: 2,
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockSummary })),
    } as unknown as Response);

    const result = await apiClient("/inventory/summary", {
      params: { warnDays: 3 },
    });

    expect(result).toEqual(mockSummary);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/inventory/summary?warnDays=3"),
      expect.objectContaining({ credentials: "same-origin" })
    );
  });

  it("sends GET /api/inventory/batches with filter", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: [] })),
    } as unknown as Response);

    const result = await apiClient("/inventory/batches", {
      params: { ingredientId: "ing-1", hasRemainingOnly: true },
    });

    expect(result).toEqual([]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/inventory/batches?ingredientId=ing-1&hasRemainingOnly=true"),
      expect.objectContaining({ credentials: "same-origin" })
    );
  });
});
