import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../client.js";
import type { WasteRadarData } from "./use-waste-radar.js";

describe("useWasteRadar API client hook (FR-WST-01, P2)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends GET /api/analytics/waste-radar and parses payload properly", async () => {
    const mockData: WasteRadarData = {
      summary: {
        totalRiskValue: "150000.00",
        totalExpiringBatches: 2,
        totalImpactedMenus: 3,
        warnDays: 7,
        wastePromoMinMarginPercent: "10.00",
      },
      items: [
        {
          batchId: "batch-1",
          ingredientId: "ing-1",
          ingredientName: "Susu Segar UHT",
          category: "Dairy",
          remainingQty: "5.000",
          unit: "L",
          costPerBase: "18000.00",
          expiryDate: "2026-11-06",
          daysUntilExpiry: 2,
          status: "EXPIRING_SOON",
          riskValue: "90000.00",
          relatedMenus: [
            {
              menuId: "m-1",
              menuName: "Cafe Latte",
              category: "Minuman",
              sellingPrice: "22000.00",
              hppPenuh: "11000.00",
              currentMarginPercent: "50.00",
              promoFloorPrice: "12500.00",
              maxDiscountAmount: "9500.00",
              maxDiscountPercent: "43.18",
              promoMarginPercent: "12.00",
            },
          ],
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true, data: mockData }),
    });

    const res = await apiClient<WasteRadarData>("/analytics/waste-radar?days=7");
    expect(res.summary.totalRiskValue).toBe("150000.00");
    expect(res.summary.totalExpiringBatches).toBe(2);
    expect(res.items[0]?.batchId).toBe("batch-1");
    expect(res.items[0]?.relatedMenus[0]?.promoFloorPrice).toBe("12500.00");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/analytics/waste-radar?days=7",
      expect.objectContaining({ credentials: "same-origin" })
    );
  });
});
