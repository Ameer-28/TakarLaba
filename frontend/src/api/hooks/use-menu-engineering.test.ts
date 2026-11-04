import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../client.js";
import type { MenuEngineeringData } from "./use-menu-engineering.js";

describe("useMenuEngineering API client hook (BR-10, FR-MEG-01)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends GET /api/analytics/menu-engineering?days=30 and parses response data", async () => {
    const mockData: MenuEngineeringData = {
      isDataSufficient: true,
      insufficientReason: null,
      days: 30,
      totalTransactions: 1300,
      totalClassifiedPortions: 1300,
      popularityThresholdPortions: "151.67",
      weightedMarginThreshold: "8641.54",
      classifiedMenus: [
        {
          menuId: "m-1",
          menuName: "Es Kopi Susu Aren",
          category: "Coffee",
          sellingPrice: "18000.00",
          hppPenuh: "8940.00",
          marginKontribusi: "9060.00",
          portionsSold: 500,
          popularitySharePercent: "38.5",
          quadrant: "STAR",
          recommendation: {
            action: "MAINTAIN_QUALITY",
            title: "Pertahankan Kualitas & Penempatan Utama",
            description: "Menu bintang penyumbang laba terbesar.",
            badgeVariant: "success",
          },
        },
      ],
      unclassifiedMenus: [],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          ok: true,
          data: mockData,
        }),
    } as Response);

    const result = await apiClient<MenuEngineeringData>("/analytics/menu-engineering?days=30");

    expect(result.isDataSufficient).toBe(true);
    expect(result.days).toBe(30);
    expect(result.totalTransactions).toBe(1300);
    expect(result.popularityThresholdPortions).toBe("151.67");
    expect(result.classifiedMenus).toHaveLength(1);
    expect(result.classifiedMenus[0]?.quadrant).toBe("STAR");
    expect(result.classifiedMenus[0]?.recommendation.action).toBe("MAINTAIN_QUALITY");
  });
});
