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

vi.mock("../../src/repositories/overhead.repo.js", () => ({
  overheadRepository: {
    findMany: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    sumActiveMonthlyOverhead: vi.fn(),
  },
  OverheadRepository: vi.fn(),
}));

vi.mock("../../src/repositories/settings.repo.js", () => ({
  settingsRepository: {
    findById: vi.fn(),
    update: vi.fn(),
  },
  SettingsRepository: vi.fn(),
}));

import { auth } from "../../src/lib/auth.js";
import { overheadRepository } from "../../src/repositories/overhead.repo.js";
import { settingsRepository } from "../../src/repositories/settings.repo.js";

describe("Overhead Costs Routes & Service Integration (T-030)", () => {
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

  describe("GET /api/overheads", () => {
    it("allows OWNER to list overheads with per-portion calculation (BR-04)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(overheadRepository.findMany).mockResolvedValueOnce([
        {
          id: "ovh-1",
          businessId: mockBusinessId,
          name: "Listrik & Air",
          type: "UTILITY",
          monthlyAmount: new Decimal("500000.00"),
          isActive: true,
          createdAt: new Date("2026-01-01T00:00:00Z"),
          updatedAt: new Date("2026-01-01T00:00:00Z"),
        },
        {
          id: "ovh-2",
          businessId: mockBusinessId,
          name: "Gaji Barista",
          type: "LABOR",
          monthlyAmount: new Decimal("700000.00"),
          isActive: true,
          createdAt: new Date("2026-01-01T00:00:00Z"),
          updatedAt: new Date("2026-01-01T00:00:00Z"),
        },
        {
          id: "ovh-3",
          businessId: mockBusinessId,
          name: "Penyusutan Mesin Lama (Nonaktif)",
          type: "DEPRECIATION",
          monthlyAmount: new Decimal("300000.00"),
          isActive: false,
          createdAt: new Date("2026-01-01T00:00:00Z"),
          updatedAt: new Date("2026-01-01T00:00:00Z"),
        },
      ]);
      vi.mocked(settingsRepository.findById).mockResolvedValueOnce({
        id: mockBusinessId,
        name: "Kedai Kopi Laba",
        isDemo: true,
        targetMarginDefault: new Decimal("50.00"),
        priceRoundingStep: 500,
        expectedMonthlyPortions: 1000,
        expiryWarnDays: 3,
        wastePromoMinMargin: new Decimal("10.00"),
        timezone: "Asia/Jakarta",
        createdAt: new Date("2026-01-01T00:00:00Z"),
      });

      const res = await request(app).get("/api/overheads");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.items).toHaveLength(3);
      // Active total = 500.000 + 700.000 = 1.200.000 (ovh-3 is inactive)
      expect(res.body.data.totalMonthlyOverhead).toBe("1200000.00");
      expect(res.body.data.expectedMonthlyPortions).toBe(1000);
      // Overhead per portion = 1.200.000 / 1000 = 1.200.00 (BR-04)
      expect(res.body.data.overheadPerPortion).toBe("1200.00");
    });

    it("forbids CASHIER from viewing overheads (RBAC)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(cashierSession);

      const res = await request(app).get("/api/overheads");

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("POST /api/overheads", () => {
    it("allows OWNER to create a new overhead cost", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(overheadRepository.create).mockResolvedValueOnce({
        id: "ovh-new",
        businessId: mockBusinessId,
        name: "Sewa Tempat",
        type: "OTHER",
        monthlyAmount: new Decimal("2000000.00"),
        isActive: true,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      });

      const res = await request(app)
        .post("/api/overheads")
        .set("Origin", "http://localhost:5173")
        .send({
          name: "Sewa Tempat",
          type: "OTHER",
          monthlyAmount: 2000000,
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.name).toBe("Sewa Tempat");
      expect(res.body.data.monthlyAmount).toBe("2000000.00");
    });

    it("rejects invalid overhead input (negative amount)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);

      const res = await request(app)
        .post("/api/overheads")
        .set("Origin", "http://localhost:5173")
        .send({
          name: "Sewa",
          type: "OTHER",
          monthlyAmount: -5000,
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("PATCH /api/overheads/:id", () => {
    it("allows OWNER to update an existing overhead cost", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(overheadRepository.findById).mockResolvedValueOnce({
        id: "ovh-1",
        businessId: mockBusinessId,
        name: "Listrik",
        type: "UTILITY",
        monthlyAmount: new Decimal("500000.00"),
        isActive: true,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      });
      vi.mocked(overheadRepository.update).mockResolvedValueOnce({
        id: "ovh-1",
        businessId: mockBusinessId,
        name: "Listrik & Internet",
        type: "UTILITY",
        monthlyAmount: new Decimal("650000.00"),
        isActive: true,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      });

      const res = await request(app)
        .patch("/api/overheads/ovh-1")
        .set("Origin", "http://localhost:5173")
        .send({
          name: "Listrik & Internet",
          monthlyAmount: 650000,
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.name).toBe("Listrik & Internet");
      expect(res.body.data.monthlyAmount).toBe("650000.00");
    });

    it("returns 404 if overhead does not exist or belongs to another tenant", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(overheadRepository.findById).mockResolvedValueOnce(null);

      const res = await request(app)
        .patch("/api/overheads/ovh-foreign")
        .set("Origin", "http://localhost:5173")
        .send({
          name: "Test",
        });

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("DELETE /api/overheads/:id", () => {
    it("allows OWNER to delete an overhead cost", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(ownerSession);
      vi.mocked(overheadRepository.findById).mockResolvedValueOnce({
        id: "ovh-1",
        businessId: mockBusinessId,
        name: "Listrik",
        type: "UTILITY",
        monthlyAmount: new Decimal("500000.00"),
        isActive: true,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      });
      vi.mocked(overheadRepository.delete).mockResolvedValueOnce({
        id: "ovh-1",
        businessId: mockBusinessId,
        name: "Listrik",
        type: "UTILITY",
        monthlyAmount: new Decimal("500000.00"),
        isActive: true,
        createdAt: new Date("2026-01-01T00:00:00Z"),
        updatedAt: new Date("2026-01-01T00:00:00Z"),
      });

      const res = await request(app).delete("/api/overheads/ovh-1");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(overheadRepository.delete).toHaveBeenCalledWith(mockBusinessId, "ovh-1");
    });
  });
});
