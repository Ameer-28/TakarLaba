import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../client.js";
import type { PosMenuItem } from "./use-pos-menus.js";

describe("usePosMenus API client integration (AC: FR-POS-01)", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends GET /api/pos/menus and returns sellable menu DTO list", async () => {
    const mockPosMenus: PosMenuItem[] = [
      {
        id: "menu-1",
        name: "Es Kopi Susu Aren",
        category: "Coffee",
        sellingPrice: "18000.00",
        hasRecipe: true,
        capacity: 10,
        bottleneckIngredientName: "Susu UHT",
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          ok: true,
          data: mockPosMenus,
        }),
    } as Response);

    const data = await apiClient<PosMenuItem[]>("/pos/menus");

    expect(data).toHaveLength(1);
    expect(data[0]?.id).toBe("menu-1");
    expect(data[0]?.capacity).toBe(10);
    expect(data[0]?.bottleneckIngredientName).toBe("Susu UHT");
    expect(data[0]?.sellingPrice).toBe("18000.00");
  });
});
