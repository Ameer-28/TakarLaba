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

  it("sends POST /api/stock/waste to record stock waste", async () => {
    const mockResponse = {
      movementId: "mov-waste-1",
      batchId: "batch-1",
      ingredientId: "ing-1",
      ingredientName: "Susu UHT",
      baseUnit: "ML",
      qtyBase: "2000.000",
      remainingQtyBase: "3000.000",
      costPerBase: "18.000000",
      wastedValue: "36000.00",
      reason: "Basi",
      createdAt: "2026-11-04T05:00:00.000Z",
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 201,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockResponse })),
    } as unknown as Response);

    const result = await apiClient("/stock/waste", {
      method: "POST",
      body: JSON.stringify({
        batchId: "batch-1",
        qty: 2,
        unit: "L",
        reason: "Basi",
      }),
    });

    expect(result).toEqual(mockResponse);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/stock/waste"),
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({
          batchId: "batch-1",
          qty: 2,
          unit: "L",
          reason: "Basi",
        }),
      })
    );
  });

  it("sends GET /api/inventory/waste to fetch waste history", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: [] })),
    } as unknown as Response);

    const result = await apiClient("/inventory/waste", {
      params: { limit: 20, skip: 0 },
    });

    expect(result).toEqual([]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/inventory/waste?limit=20&skip=0"),
      expect.objectContaining({ credentials: "same-origin" })
    );
  });
});
