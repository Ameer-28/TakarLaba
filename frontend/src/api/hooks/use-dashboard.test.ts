import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../client.js";

describe("Dashboard API client integration (T-053 — FR-DASH-01)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("fetches GET /api/dashboard/summary successfully", async () => {
    const mockSummaryData = {
      summary: {
        omzet: "150000.00",
        transactionCount: 8,
        estimatedProfit: "75000.00",
        averageMarginPercent: "50.0",
        openAlertCount: 1,
        expiringStockValue: "100000.00",
        lowStockCount: 1,
        targetMargin: "50.0",
        expiryWarnDays: 3,
      },
      topAlerts: [
        {
          id: "alert-1",
          menuId: "menu-1",
          menuName: "Es Kopi Susu Aren",
          category: "Coffee",
          status: "OPEN" as const,
          currentPrice: "18000.00",
          recommendedPrice: "20000.00",
          marginBeforePct: "50.3",
          marginAfterPct: "45.3",
          targetPct: "50.0",
          ingredientCostBefore: "7740.00",
          ingredientCostAfter: "8640.00",
          fullCostBefore: "8940.00",
          fullCostAfter: "9840.00",
          createdAt: "2026-10-31T08:00:00.000Z",
        },
      ],
      lowestCapacityMenus: [
        {
          id: "menu-1",
          name: "Es Kopi Susu Aren",
          category: "Coffee",
          sellingPrice: "18000.00",
          capacity: 10,
          hasRecipe: true,
          bottleneckIngredient: {
            id: "ing-susu",
            name: "Susu UHT",
            remainingStock: "1500.000",
            unit: "ml",
          },
        },
      ],
      recentSales: [
        {
          id: "sale-1",
          invoiceNo: "INV-20261031-0001",
          soldAt: "2026-10-31T10:00:00.000Z",
          totalAmount: "36000.00",
          paymentMethod: "QRIS",
          cashierName: "Kasir 1",
          itemCount: 2,
        },
      ],
      isNewBusiness: false,
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          ok: true,
          data: mockSummaryData,
        }),
    } as Response);

    const data = await apiClient<typeof mockSummaryData>("/dashboard/summary");

    expect(data.summary.omzet).toBe("150000.00");
    expect(data.summary.estimatedProfit).toBe("75000.00");
    expect(data.topAlerts).toHaveLength(1);
    expect(data.lowestCapacityMenus).toHaveLength(1);
    expect(data.lowestCapacityMenus[0]?.capacity).toBe(10);
    expect(data.recentSales).toHaveLength(1);
  });
});
