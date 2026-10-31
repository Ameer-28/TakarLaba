import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../client.js";

describe("Alerts API client integration (T-052 — FR-PSI-01)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends GET /api/alerts and returns alert list", async () => {
    const mockAlerts = [
      {
        id: "alert-1",
        businessId: "biz-1",
        menuId: "menu-1",
        menu: {
          id: "menu-1",
          name: "Es Kopi Susu Aren",
          sellingPrice: "18000.00",
          targetMargin: "50.00",
        },
        status: "OPEN",
        resolution: null,
        note: null,
        createdAt: "2026-10-30T01:00:00.000Z",
        resolvedAt: null,
        resolvedBy: null,
        triggerIngredient: {
          id: "ing-susu",
          name: "Susu UHT",
          baseUnit: "ML",
        },
        triggerPurchase: {
          id: "pur-1",
          supplierName: "Distributor Susu Segar",
          purchasedAt: "2026-10-30T00:55:00.000Z",
        },
        ingredientCostBefore: "7740.00",
        ingredientCostAfter: "8640.00",
        fullCostBefore: "8940.00",
        fullCostAfter: "9840.00",
        marginBeforePct: "50.33",
        marginAfterPct: "45.33",
        targetPct: "50.00",
        sellingPriceAtTrigger: "18000.00",
        recommendedPrice: "20000.00",
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockAlerts })),
    } as unknown as Response);

    const result = await apiClient("/alerts", { params: { status: "OPEN" } });

    expect(result).toEqual(mockAlerts);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/alerts?status=OPEN"),
      expect.objectContaining({ credentials: "same-origin" })
    );
  });

  it("sends GET /api/alerts/:id and returns alert detail with recommendations", async () => {
    const mockDetail = {
      id: "alert-1",
      businessId: "biz-1",
      menuId: "menu-1",
      menuName: "Es Kopi Susu Aren",
      menuSellingPrice: "18000.00",
      status: "OPEN",
      resolution: null,
      note: null,
      createdAt: "2026-10-30T01:00:00.000Z",
      resolvedAt: null,
      resolvedBy: null,
      triggerPurchase: null,
      triggerIngredient: null,
      costs: {
        ingredientCostBefore: "7740.00",
        ingredientCostAfter: "8640.00",
        fullCostBefore: "8940.00",
        fullCostAfter: "9840.00",
        marginBeforePct: "50.33",
        marginAfterPct: "45.33",
        targetPct: "50.00",
        sellingPriceAtTrigger: "18000.00",
      },
      optionA: {
        recommendedPrice: "20000.00",
        projectedMarginPercent: "50.80",
        projectedMarginKontribusi: "10160.00",
        priceIncrease: "2000.00",
      },
      optionB: {
        maxAllowableCost: "9000.00",
        costSavingNeeded: "840.00",
        currentTakaran: "150.000",
        reducedAmount: "35.000",
        newTakaran: "115.000",
        unit: "ML",
        reductionPercent: "23.33",
        isFeasible: true,
      },
      recipe: [],
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockDetail })),
    } as unknown as Response);

    const result = await apiClient("/alerts/alert-1");

    expect(result).toEqual(mockDetail);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/alerts/alert-1"),
      expect.objectContaining({ credentials: "same-origin" })
    );
  });

  it("sends POST /api/alerts/:id/apply-price", async () => {
    const mockResolved = {
      id: "alert-1",
      status: "RESOLVED",
      resolution: "PRICE_RAISED",
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockResolved })),
    } as unknown as Response);

    const result = await apiClient("/alerts/alert-1/apply-price", { method: "POST" });

    expect(result).toEqual(mockResolved);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/alerts/alert-1/apply-price"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("sends POST /api/alerts/:id/dismiss with note", async () => {
    const mockDismissed = {
      id: "alert-1",
      status: "RESOLVED",
      resolution: "DISMISSED",
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockDismissed })),
    } as unknown as Response);

    const result = await apiClient("/alerts/alert-1/dismiss", {
      method: "POST",
      body: JSON.stringify({ note: "Menunggu promo selesai" }),
    });

    expect(result).toEqual(mockDismissed);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/alerts/alert-1/dismiss"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ note: "Menunggu promo selesai" }),
      })
    );
  });

  it("sends POST /api/alerts/:id/acknowledge", async () => {
    const mockAck = {
      id: "alert-1",
      status: "ACKNOWLEDGED",
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockAck })),
    } as unknown as Response);

    const result = await apiClient("/alerts/alert-1/acknowledge", { method: "POST" });

    expect(result).toEqual(mockAck);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/alerts/alert-1/acknowledge"),
      expect.objectContaining({ method: "POST" })
    );
  });
});
