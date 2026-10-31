import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/create-app.js";
import { Decimal } from "decimal.js";

vi.mock("../../src/lib/auth.js", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("../../src/repositories/alert.repo.js", () => ({
  alertRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    findActiveByMenuId: vi.fn(),
    findActiveAlerts: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    resolve: vi.fn(),
    acknowledge: vi.fn(),
    countOpen: vi.fn(),
  },
  AlertRepository: vi.fn(),
}));

vi.mock("../../src/repositories/menu.repo.js", () => ({
  menuRepository: {
    findById: vi.fn(),
    update: vi.fn(),
    getLatestCostPerBaseMap: vi.fn(),
  },
  MenuRepository: vi.fn(),
}));

import { auth } from "../../src/lib/auth.js";
import { alertRepository } from "../../src/repositories/alert.repo.js";
import { menuRepository } from "../../src/repositories/menu.repo.js";

describe("Margin Alert Routes & Evaluation (T-051 — AC: FR-PSI-01, BR-05, BR-06)", () => {
  const app = createApp();
  const mockBusinessId = "biz-demo-123";
  const mockOwnerId = "user-owner-1";

  const ownerSession = {
    user: {
      id: mockOwnerId,
      email: "owner@demo.id",
      name: "Owner Demo",
      role: "OWNER",
      businessId: mockBusinessId,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "sess-1",
      userId: mockOwnerId,
      token: "tok-1",
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const cashierSession = {
    user: {
      id: "user-cashier-1",
      email: "cashier@demo.id",
      name: "Kasir Demo",
      role: "CASHIER",
      businessId: mockBusinessId,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "sess-2",
      userId: "user-cashier-1",
      token: "tok-2",
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Role & Tenant Authorization (Rule 7 & FR-AUTH-03)", () => {
    it("rejects unauthenticated requests with 401 UNAUTHENTICATED", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null);

      const res = await request(app).get("/api/alerts");
      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHENTICATED");
    });

    it("rejects CASHIER access with 403 FORBIDDEN (Rule 7 confidentiality)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(cashierSession);

      const res = await request(app).get("/api/alerts");
      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("GET /api/alerts - List Alerts", () => {
    it("returns paginated list of alerts for owner", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(alertRepository.findMany).mockResolvedValueOnce({
        items: [
          {
            id: "alert-1",
            businessId: mockBusinessId,
            menuId: "menu-kopi",
            status: "OPEN",
            resolution: null,
            note: null,
            createdAt: new Date("2026-10-30T01:00:00Z"),
            resolvedAt: null,
            resolvedById: null,
            menu: {
              id: "menu-kopi",
              name: "Es Kopi Susu Aren",
              sellingPrice: new Decimal("18000"),
              targetMargin: new Decimal("50"),
            },
            triggerIngredient: {
              id: "ing-susu",
              name: "Susu UHT",
              baseUnit: "ML",
            },
            triggerPurchase: {
              id: "pur-1",
              supplierName: "Distributor Susu Segar",
              purchasedAt: new Date("2026-10-30T00:55:00Z"),
            },
            resolvedBy: null,
            ingredientCostBefore: new Decimal("7740"),
            ingredientCostAfter: new Decimal("8640"),
            fullCostBefore: new Decimal("8940"),
            fullCostAfter: new Decimal("9840"),
            marginBeforePct: new Decimal("50.33"),
            marginAfterPct: new Decimal("45.33"),
            targetPct: new Decimal("50"),
            sellingPriceAtTrigger: new Decimal("18000"),
            recommendedPrice: new Decimal("20000"),
          },
        ] as unknown as Awaited<ReturnType<typeof alertRepository.findMany>>["items"],
        total: 1,
      });

      const res = await request(app).get("/api/alerts?status=OPEN&page=1&limit=20");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].menu.name).toBe("Es Kopi Susu Aren");
      expect(res.body.data[0].recommendedPrice).toBe("20000.00");
      expect(res.body.meta.total).toBe(1);
    });
  });

  describe("GET /api/alerts/:id - Alert Detail & Recommendations", () => {
    it("returns 404 when alert does not exist", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(alertRepository.findById).mockResolvedValueOnce(null);

      const res = await request(app).get("/api/alerts/non-existent");
      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("returns alert detail with Option A and Option B computed correctly", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(alertRepository.findById).mockResolvedValueOnce({
        id: "alert-1",
        businessId: mockBusinessId,
        menuId: "menu-kopi",
        status: "OPEN",
        resolution: null,
        note: null,
        createdAt: new Date("2026-10-30T01:00:00Z"),
        resolvedAt: null,
        resolvedById: null,
        menu: {
          id: "menu-kopi",
          name: "Es Kopi Susu Aren",
          sellingPrice: new Decimal("18000"),
          targetMargin: new Decimal("50"),
          recipeItems: [
            {
              id: "rec-1",
              ingredientId: "ing-susu",
              qtyUsableBase: new Decimal("150"),
              ingredient: {
                id: "ing-susu",
                name: "Susu UHT",
                baseUnit: "ML",
                yieldPercent: new Decimal("100"),
              },
            },
          ],
        },
        triggerIngredientId: "ing-susu",
        triggerIngredient: {
          id: "ing-susu",
          name: "Susu UHT",
          baseUnit: "ML",
        },
        triggerPurchase: {
          id: "pur-1",
          supplierName: "Distributor Susu Segar",
          purchasedAt: new Date("2026-10-30T00:55:00Z"),
        },
        resolvedBy: null,
        ingredientCostBefore: new Decimal("7740"),
        ingredientCostAfter: new Decimal("8640"),
        fullCostBefore: new Decimal("8940"),
        fullCostAfter: new Decimal("9840"),
        marginBeforePct: new Decimal("50.33"),
        marginAfterPct: new Decimal("45.33"),
        targetPct: new Decimal("50"),
        sellingPriceAtTrigger: new Decimal("18000"),
        recommendedPrice: new Decimal("20000"),
      } as unknown as Awaited<ReturnType<typeof alertRepository.findById>>);

      vi.mocked(menuRepository.getLatestCostPerBaseMap).mockResolvedValueOnce(
        new Map([["ing-susu", new Decimal("24")]])
      );

      const res = await request(app).get("/api/alerts/alert-1");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const alert = res.body.data;
      expect(alert.id).toBe("alert-1");
      expect(alert.costs.fullCostAfter).toBe("9840.00");
      expect(alert.costs.marginAfterPct).toBe("45.33");

      // Option A: Naikkan Harga -> Rp20.000
      expect(alert.optionA.recommendedPrice).toBe("20000.00");
      expect(alert.optionA.priceIncrease).toBe("2000.00");

      // Option B: Efisiensi Porsi -> 115 ml
      expect(alert.optionB.isFeasible).toBe(true);
      expect(alert.optionB.reducedAmount).toBe("35.000");
      expect(alert.optionB.newTakaran).toBe("115.000");
    });
  });

  describe("POST /api/alerts/:id/apply-price - Apply Option A", () => {
    it("updates menu selling price and resolves alert as PRICE_RAISED", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(alertRepository.findById).mockResolvedValueOnce({
        id: "alert-1",
        businessId: mockBusinessId,
        menuId: "menu-kopi",
        status: "OPEN",
        recommendedPrice: new Decimal("20000"),
        sellingPriceAtTrigger: new Decimal("18000"),
      } as unknown as Awaited<ReturnType<typeof alertRepository.findById>>);

      vi.mocked(menuRepository.findById).mockResolvedValue({
        id: "menu-kopi",
        businessId: mockBusinessId,
        name: "Es Kopi Susu Aren",
        nameKey: "es-kopi-susu-aren",
        category: null,
        sellingPrice: "18000.00",
        targetMargin: "50.00",
        isActive: true,
        hasRecipe: false,
        recipeItemsCount: 0,
        saleItemsCount: 0,
        recipeItems: [],
        priceHistories: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(menuRepository.update).mockResolvedValueOnce({
        id: "menu-kopi",
        businessId: mockBusinessId,
        name: "Es Kopi Susu Aren",
        nameKey: "es-kopi-susu-aren",
        category: null,
        sellingPrice: "20000.00",
        targetMargin: "50.00",
        isActive: true,
        hasRecipe: false,
        recipeItemsCount: 0,
        saleItemsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.mocked(alertRepository.resolve).mockResolvedValueOnce({
        id: "alert-1",
        status: "RESOLVED",
        resolution: "PRICE_RAISED",
      } as unknown as Awaited<ReturnType<typeof alertRepository.resolve>>);

      // reevaluate mock
      vi.mocked(alertRepository.findActiveByMenuId).mockResolvedValueOnce(null);

      const res = await request(app).post("/api/alerts/alert-1/apply-price");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.resolution).toBe("PRICE_RAISED");

      expect(menuRepository.update).toHaveBeenCalledWith(
        mockBusinessId,
        "menu-kopi",
        { sellingPrice: new Decimal("20000") },
        expect.objectContaining({
          reason: "PRICE_SHOCK_ALERT",
          changedById: mockOwnerId,
          alertId: "alert-1",
        })
      );
    });
  });

  describe("POST /api/alerts/:id/dismiss - Dismiss Alert", () => {
    it("resolves alert with DISMISSED and optional note", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(alertRepository.findById).mockResolvedValueOnce({
        id: "alert-1",
        businessId: mockBusinessId,
        status: "OPEN",
      } as unknown as Awaited<ReturnType<typeof alertRepository.findById>>);

      vi.mocked(alertRepository.resolve).mockResolvedValueOnce({
        id: "alert-1",
        status: "RESOLVED",
        resolution: "DISMISSED",
        note: "Menunggu promo akhir pekan selesai",
      } as unknown as Awaited<ReturnType<typeof alertRepository.resolve>>);

      const res = await request(app)
        .post("/api/alerts/alert-1/dismiss")
        .send({ note: "Menunggu promo akhir pekan selesai" });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.resolution).toBe("DISMISSED");
      expect(alertRepository.resolve).toHaveBeenCalledWith(
        "alert-1",
        "DISMISSED",
        mockOwnerId,
        "Menunggu promo akhir pekan selesai"
      );
    });
  });

  describe("POST /api/alerts/:id/acknowledge - Acknowledge Alert", () => {
    it("transitions alert status from OPEN to ACKNOWLEDGED", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(alertRepository.findById).mockResolvedValueOnce({
        id: "alert-1",
        businessId: mockBusinessId,
        status: "OPEN",
      } as unknown as Awaited<ReturnType<typeof alertRepository.findById>>);

      vi.mocked(alertRepository.acknowledge).mockResolvedValueOnce({
        id: "alert-1",
        status: "ACKNOWLEDGED",
      } as unknown as Awaited<ReturnType<typeof alertRepository.acknowledge>>);

      const res = await request(app).post("/api/alerts/alert-1/acknowledge");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe("ACKNOWLEDGED");
      expect(alertRepository.acknowledge).toHaveBeenCalledWith("alert-1");
    });
  });
});
