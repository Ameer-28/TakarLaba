import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../client.js";
import type { CapacityMenuItem } from "./use-capacity.js";

describe("useCapacity API client integration (BR-08, FR-CAP-01)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends GET /api/analytics/capacity and returns capacity item list with bottlenecks", async () => {
    const mockCapacityData: CapacityMenuItem[] = [
      {
        id: "menu-1",
        name: "Es Kopi Susu Aren",
        category: "Coffee",
        sellingPrice: "18000.00",
        hasRecipe: true,
        capacity: 25,
        bottleneckIngredientName: "Susu UHT",
        bottleneck: {
          ingredientId: "ing-1",
          ingredientName: "Susu UHT",
          baseUnit: "ML",
          validStockBase: "3750.000",
          rawPerPortion: "150.000",
          maxPortions: 25,
        },
        items: [
          {
            ingredientId: "ing-1",
            ingredientName: "Susu UHT",
            baseUnit: "ML",
            validStockBase: "3750.000",
            rawPerPortion: "150.000",
            maxPortions: 25,
          },
        ],
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          ok: true,
          data: mockCapacityData,
        }),
    } as Response);

    const data = await apiClient<CapacityMenuItem[]>("/analytics/capacity");

    expect(data).toHaveLength(1);
    expect(data[0]?.id).toBe("menu-1");
    expect(data[0]?.capacity).toBe(25);
    expect(data[0]?.bottleneckIngredientName).toBe("Susu UHT");
    expect(data[0]?.bottleneck?.maxPortions).toBe(25);
    expect(data[0]?.items).toHaveLength(1);
  });
});
