import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../client.js";

describe("useRegisterOwner API client integration", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends POST /api/register to register owner and create business", async () => {
    const payload = {
      name: "Budi Santoso",
      businessName: "Kopi Mantap Jiwa",
      email: "budi@kopimantap.id",
      password: "Password123!",
    };

    const mockResponse = {
      user: {
        id: "user-123",
        name: "Budi Santoso",
        email: "budi@kopimantap.id",
        role: "OWNER",
        businessId: "biz-123",
        isActive: true,
      },
      business: {
        id: "biz-123",
        name: "Kopi Mantap Jiwa",
        isDemo: false,
        targetMarginDefault: "50.00",
        expectedMonthlyPortions: 1000,
        priceRoundingStep: 500,
        expiryWarnDays: 3,
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 201,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockResponse })),
    } as unknown as Response);

    const result = await apiClient("/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    expect(result).toEqual(mockResponse);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  });
});
