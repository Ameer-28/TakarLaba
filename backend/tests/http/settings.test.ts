import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { Decimal } from "decimal.js";
import { createApp } from "../../src/create-app.js";

vi.mock("../../src/lib/auth.js", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("../../src/repositories/settings.repo.js", () => ({
  settingsRepository: {
    findById: vi.fn(),
    update: vi.fn(),
  },
  SettingsRepository: vi.fn(),
}));

import { auth } from "../../src/lib/auth.js";
import { settingsRepository } from "../../src/repositories/settings.repo.js";

describe("Business Settings Routes & Service Integration (T-030)", () => {
  const app = createApp();
  const mockBusinessId = "biz-demo-123";

  const ownerSession = {
    user: {
      id: "user-owner-1",
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
      userId: "user-owner-1",
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

  describe("GET /api/settings", () => {
    it("allows OWNER to view business settings", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(settingsRepository.findById).mockResolvedValueOnce({
        id: mockBusinessId,
        name: "Kedai Kopi Laba",
        isDemo: true,
        targetMarginDefault: new Decimal("50.00"),
        priceRoundingStep: 500,
        expectedMonthlyPortions: 1200,
        expiryWarnDays: 3,
        wastePromoMinMargin: new Decimal("10.00"),
        timezone: "Asia/Jakarta",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      });

      const res = await request(app).get("/api/settings");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data).toEqual({
        id: mockBusinessId,
        name: "Kedai Kopi Laba",
        isDemo: true,
        targetMarginDefault: "50",
        priceRoundingStep: 500,
        expectedMonthlyPortions: 1200,
        expiryWarnDays: 3,
        wastePromoMinMargin: "10",
        timezone: "Asia/Jakarta",
        createdAt: "2026-01-01T00:00:00.000Z",
      });
      expect(settingsRepository.findById).toHaveBeenCalledWith(mockBusinessId);
    });

    it("forbids CASHIER from viewing business settings (RBAC)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(cashierSession);

      const res = await request(app).get("/api/settings");

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("PATCH /api/settings", () => {
    it("allows OWNER to update business settings", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(settingsRepository.findById).mockResolvedValueOnce({
        id: mockBusinessId,
        name: "Kedai Kopi Laba",
        isDemo: true,
        targetMarginDefault: new Decimal("50.00"),
        priceRoundingStep: 500,
        expectedMonthlyPortions: 1200,
        expiryWarnDays: 3,
        wastePromoMinMargin: new Decimal("10.00"),
        timezone: "Asia/Jakarta",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      });
      vi.mocked(settingsRepository.update).mockResolvedValueOnce({
        id: mockBusinessId,
        name: "Kedai Kopi Laba Baru",
        isDemo: true,
        targetMarginDefault: new Decimal("55.00"),
        priceRoundingStep: 1000,
        expectedMonthlyPortions: 1500,
        expiryWarnDays: 5,
        wastePromoMinMargin: new Decimal("12.00"),
        timezone: "Asia/Jakarta",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      });

      const res = await request(app)
        .patch("/api/settings")
        .set("Origin", "http://localhost:5173")
        .send({
          name: "Kedai Kopi Laba Baru",
          targetMarginDefault: 55,
          priceRoundingStep: 1000,
          expectedMonthlyPortions: 1500,
          expiryWarnDays: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.targetMarginDefault).toBe("55");
      expect(res.body.data.priceRoundingStep).toBe(1000);
      expect(res.body.data.expectedMonthlyPortions).toBe(1500);
    });

    it("rejects invalid target margin (> 95%) with validation error", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);

      const res = await request(app)
        .patch("/api/settings")
        .set("Origin", "http://localhost:5173")
        .send({
          targetMarginDefault: 99,
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("rejects invalid price rounding step", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);

      const res = await request(app)
        .patch("/api/settings")
        .set("Origin", "http://localhost:5173")
        .send({
          priceRoundingStep: 250, // not in [1, 50, 100, 500, 1000]
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("forbids CASHIER from updating business settings (RBAC)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(cashierSession);

      const res = await request(app)
        .patch("/api/settings")
        .set("Origin", "http://localhost:5173")
        .send({
          name: "Hacked by Cashier",
        });

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });
});
