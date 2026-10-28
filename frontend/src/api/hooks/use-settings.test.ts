import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../client.js";

describe("Settings API client integration", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends GET /api/settings and returns settings data", async () => {
    const mockData = {
      id: "biz-1",
      name: "Kedai Kopi Laba",
      isDemo: true,
      targetMarginDefault: "50.00",
      priceRoundingStep: 500,
      expectedMonthlyPortions: 1000,
      expiryWarnDays: 3,
      wastePromoMinMargin: "10.00",
      timezone: "Asia/Jakarta",
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockData })),
    } as unknown as Response);

    const result = await apiClient("/api/settings");

    expect(result).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/settings"),
      expect.objectContaining({ credentials: "same-origin" })
    );
  });

  it("sends PATCH /api/settings with updated data", async () => {
    const payload = {
      targetMarginDefault: 55,
      priceRoundingStep: 1000,
    };

    const mockUpdated = {
      id: "biz-1",
      name: "Kedai Kopi Laba",
      isDemo: true,
      targetMarginDefault: "55.00",
      priceRoundingStep: 1000,
      expectedMonthlyPortions: 1000,
      expiryWarnDays: 3,
      wastePromoMinMargin: "10.00",
      timezone: "Asia/Jakarta",
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockUpdated })),
    } as unknown as Response);

    const result = await apiClient("/api/settings", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    expect(result).toEqual(mockUpdated);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/settings"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    );
  });
});
