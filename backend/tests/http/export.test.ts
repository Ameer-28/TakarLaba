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

vi.mock("../../src/repositories/sale.repo.js", () => ({
  saleRepository: {
    findMany: vi.fn(),
  },
  SaleRepository: vi.fn(),
}));

vi.mock("../../src/repositories/inventory.repo.js", () => ({
  inventoryRepository: {
    findIngredientsWithBatches: vi.fn(),
  },
  InventoryRepository: vi.fn(),
}));

vi.mock("../../src/repositories/settings.repo.js", () => ({
  settingsRepository: {
    findById: vi.fn(),
  },
  SettingsRepository: vi.fn(),
}));

import { auth } from "../../src/lib/auth.js";
import { saleRepository } from "../../src/repositories/sale.repo.js";
import { inventoryRepository } from "../../src/repositories/inventory.repo.js";
import { settingsRepository } from "../../src/repositories/settings.repo.js";

describe("Export HTTP Endpoints (GET /api/export/*) (T-201 — FR-RPT-01)", () => {
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
      id: "sess-owner",
      userId: "user-owner-1",
      token: "tok-owner",
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const cashierSession = {
    user: {
      id: "user-cashier-1",
      email: "kasir@demo.id",
      name: "Kasir Demo",
      role: "CASHIER",
      businessId: mockBusinessId,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "sess-cashier",
      userId: "user-cashier-1",
      token: "tok-cashier",
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/export/sales.csv", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null as never);

      const res = await request(app).get("/api/export/sales.csv");
      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHENTICATED");
    });

    it("returns 403 when accessed by CASHIER (Rule 7, OWNER only)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(cashierSession as never);

      const res = await request(app).get("/api/export/sales.csv");
      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 400 when date query parameter is malformed", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession as never);

      const res = await request(app).get("/api/export/sales.csv?startDate=invalid-date");
      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 200 with text/csv attachment and formatted sales records for OWNER", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession as never);

      vi.mocked(saleRepository.findMany).mockResolvedValue({
        sales: [
          {
            id: "sale-101",
            invoiceNo: "INV-20261105-0001",
            soldAt: new Date("2026-11-05T09:00:00.000Z"),
            status: "COMPLETED",
            paymentMethod: "QRIS",
            totalAmount: new Decimal("36000.00"),
            totalIngredientCost: new Decimal("14000.00"),
            totalOverhead: new Decimal("2400.00"),
            voidReason: null,
            cashier: { id: "c-1", name: "Dimas Kasir", role: "CASHIER" },
            items: [
              {
                id: "item-1",
                saleId: "sale-101",
                menuId: "m-1",
                menuNameSnapshot: "Es Kopi Susu",
                qty: 2,
                unitPrice: new Decimal("18000.00"),
                subtotal: new Decimal("36000.00"),
                ingredientCostActual: new Decimal("7000.00"),
                overheadAllocated: new Decimal("1200.00"),
              },
            ],
          },
        ],
        total: 1,
      } as never);

      const res = await request(app).get("/api/export/sales.csv?status=ALL");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.headers["content-disposition"]).toContain('attachment; filename="penjualan-');

      const csvText = res.text;
      expect(csvText.startsWith("\uFEFF")).toBe(true);
      expect(csvText).toContain("No Transaksi,Waktu Transaksi (WIB),Status,Kasir,Metode Bayar");
      expect(csvText).toContain("INV-20261105-0001");
      expect(csvText).toContain("Dimas Kasir");
      expect(csvText).toContain("36000.00");
      expect(csvText).toContain("2x Es Kopi Susu (@Rp18000.00)");
    });
  });

  describe("GET /api/export/stock.csv", () => {
    it("returns 401 when unauthenticated", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null as never);

      const res = await request(app).get("/api/export/stock.csv");
      expect(res.status).toBe(401);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHENTICATED");
    });

    it("returns 403 when accessed by CASHIER (Rule 7, OWNER only)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(cashierSession as never);

      const res = await request(app).get("/api/export/stock.csv");
      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 200 with text/csv attachment and inventory stock valuation for OWNER", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession as never);

      vi.mocked(settingsRepository.findById).mockResolvedValue({
        id: mockBusinessId,
        expiryWarnDays: 5,
      } as never);

      vi.mocked(inventoryRepository.findIngredientsWithBatches).mockResolvedValue([
        {
          id: "ing-1",
          name: "Susu Segar UHT",
          category: "Dairy",
          baseUnit: "ML",
          yieldPercent: new Decimal(100),
          stockBatches: [
            {
              id: "batch-1",
              remainingQtyBase: new Decimal("2000.000"),
              costPerBase: new Decimal("20.00"),
              expiryDate: new Date("2026-11-08T00:00:00.000Z"),
              receivedAt: new Date("2026-11-01T00:00:00.000Z"),
            },
          ],
        },
      ] as never);

      const res = await request(app).get("/api/export/stock.csv");
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.headers["content-disposition"]).toContain('attachment; filename="stok-bahan-');

      const csvText = res.text;
      expect(csvText.startsWith("\uFEFF")).toBe(true);
      expect(csvText).toContain(
        "Nama Bahan,Kategori,Satuan Pakai,Rendemen (Yield %),Total Sisa Stok"
      );
      expect(csvText).toContain("Susu Segar UHT,Dairy,ML,100.00%,2000.000,20.00,40000.00,1");
    });
  });
});
