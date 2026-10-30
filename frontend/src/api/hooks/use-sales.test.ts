import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../client.js";
import type { SaleDetail, CreateSalePayload } from "./use-sales.js";

describe("Sales API client integration (T-041)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends POST /api/sales with Idempotency-Key header", async () => {
    const payload: CreateSalePayload = {
      paymentMethod: "CASH",
      items: [{ menuId: "menu-hero", qty: 2 }],
    };

    const mockResponse: SaleDetail = {
      id: "sale-123",
      invoiceNo: "INV-20261029-A1B2C3",
      idempotencyKey: "idem-key-999",
      soldAt: "2026-10-29T10:00:00.000Z",
      cashierId: "user-cashier-1",
      paymentMethod: "CASH",
      totalAmount: "36000.00",
      status: "COMPLETED",
      items: [
        {
          id: "item-1",
          menuId: "menu-hero",
          menuNameSnapshot: "Es Kopi Susu Aren",
          qty: 2,
          unitPrice: "18000.00",
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 201,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockResponse })),
    } as unknown as Response);

    const result = await apiClient<SaleDetail>("/sales", {
      method: "POST",
      idempotencyKey: "idem-key-999",
      body: JSON.stringify(payload),
    });

    expect(result).toEqual(mockResponse);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = (
      globalThis.fetch as unknown as { mock: { calls: [string, RequestInit][] } }
    ).mock.calls[0]!;
    expect(calledUrl).toBe("/api/sales");
    expect(calledInit.method).toBe("POST");
    expect(calledInit.credentials).toBe("same-origin");
    expect((calledInit.headers as Headers).get("Idempotency-Key")).toBe("idem-key-999");
  });

  it("sends GET /api/sales/:id to fetch sale detail", async () => {
    const mockDetail: SaleDetail = {
      id: "sale-123",
      invoiceNo: "INV-20261029-A1B2C3",
      idempotencyKey: "idem-key-999",
      soldAt: "2026-10-29T10:00:00.000Z",
      cashierId: "user-owner-1",
      paymentMethod: "QRIS",
      totalAmount: "36000.00",
      totalIngredientCost: "15480.00",
      totalOverhead: "2400.00",
      status: "COMPLETED",
      items: [
        {
          id: "item-1",
          menuId: "menu-hero",
          menuNameSnapshot: "Es Kopi Susu Aren",
          qty: 2,
          unitPrice: "18000.00",
          ingredientCostActual: "15480.00",
          overheadAllocated: "2400.00",
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockDetail })),
    } as unknown as Response);

    const result = await apiClient<SaleDetail>("/sales/sale-123");

    expect(result).toEqual(mockDetail);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/sales/sale-123",
      expect.objectContaining({
        credentials: "same-origin",
      })
    );
  });

  it("sends GET /api/sales with filter query parameters", async () => {
    const mockList = {
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      text: vi.fn().mockResolvedValueOnce(JSON.stringify({ ok: true, data: mockList })),
    } as unknown as Response);

    const searchParams = new URLSearchParams({
      startDate: "2026-10-01",
      endDate: "2026-10-29",
      paymentMethod: "CASH",
    });

    const result = await apiClient(`/sales?${searchParams.toString()}`);
    expect(result).toEqual(mockList);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/sales?startDate=2026-10-01&endDate=2026-10-29&paymentMethod=CASH",
      expect.objectContaining({
        credentials: "same-origin",
      })
    );
  });
});
