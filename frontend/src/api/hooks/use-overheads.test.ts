import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../client.js";

describe("Overhead API client integration", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends GET /api/overheads with calculation metrics", async () => {
    const mockData = {
      items: [
        {
          id: "ovh-1",
          businessId: "biz-1",
          name: "Listrik & Air",
          type: "UTILITY",
          monthlyAmount: "500000.00",
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      totalMonthlyOverhead: "500000.00",
      expectedMonthlyPortions: 1000,
      overheadPerPortion: "500.00",
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockData })),
    } as unknown as Response);

    const result = await apiClient("/api/overheads", {
      params: { isActive: true },
    });

    expect(result).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/overheads?isActive=true"),
      expect.objectContaining({ credentials: "same-origin" })
    );
  });

  it("sends POST /api/overheads to create an overhead cost", async () => {
    const payload = {
      name: "Listrik",
      type: "UTILITY",
      monthlyAmount: 500000,
    };

    const mockCreated = {
      id: "ovh-1",
      businessId: "biz-1",
      name: "Listrik",
      type: "UTILITY",
      monthlyAmount: "500000.00",
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockCreated })),
    } as unknown as Response);

    const result = await apiClient("/api/overheads", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    expect(result).toEqual(mockCreated);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/overheads"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  });
});
