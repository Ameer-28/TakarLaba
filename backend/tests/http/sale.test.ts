import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../src/create-app.js";
import { Decimal } from "decimal.js";
import { InsufficientStockError } from "../../src/lib/errors.js";

vi.mock("../../src/lib/auth.js", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("../../src/repositories/sale.repo.js", () => ({
  saleRepository: {
    checkoutAtomic: vi.fn(),
    findByIdempotencyKey: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
  },
  SaleRepository: vi.fn(),
  generateInvoiceNo: vi.fn(() => "INV-20261029-A1B2C3"),
}));

vi.mock("../../src/repositories/settings.repo.js", () => ({
  settingsRepository: {
    findById: vi.fn(),
  },
  SettingsRepository: vi.fn(),
}));

vi.mock("../../src/repositories/overhead.repo.js", () => ({
  overheadRepository: {
    sumActiveMonthlyOverhead: vi.fn(),
  },
  OverheadRepository: vi.fn(),
}));

import { auth } from "../../src/lib/auth.js";
import { saleRepository } from "../../src/repositories/sale.repo.js";
import { settingsRepository } from "../../src/repositories/settings.repo.js";
import { overheadRepository } from "../../src/repositories/overhead.repo.js";

describe("POS Sales Routes (T-041 — FR-POS-01, FR-POS-02)", () => {
  const app = createApp();
  const mockBusinessId = "biz-demo-123";
  const mockOwnerId = "user-owner-1";
  const mockCashierId = "user-cashier-1";

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
      id: mockCashierId,
      email: "cashier@demo.id",
      name: "Cashier Demo",
      role: "CASHIER",
      businessId: mockBusinessId,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "sess-2",
      userId: mockCashierId,
      token: "tok-2",
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(overheadRepository.sumActiveMonthlyOverhead).mockResolvedValue(
      new Decimal("3600000")
    );
    vi.mocked(settingsRepository.findById).mockResolvedValue({
      id: mockBusinessId,
      name: "Demo Cafe",
      isDemo: true,
      targetMarginDefault: new Decimal("50.00"),
      roundingStep: 500,
      expectedMonthlyPortions: 3000,
      demoResetAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe("POST /api/sales", () => {
    const validSalePayload = {
      paymentMethod: "CASH",
      items: [{ menuId: "menu-hero", qty: 2 }],
    };

    const mockCreatedSale = {
      id: "sale-1",
      businessId: mockBusinessId,
      invoiceNo: "INV-20261029-A1B2C3",
      idempotencyKey: "idem-key-1",
      soldAt: new Date("2026-10-29T10:00:00.000Z"),
      cashierId: mockOwnerId,
      paymentMethod: "CASH" as const,
      totalAmount: new Decimal("36000.00"),
      totalIngredientCost: new Decimal("15480.00"),
      totalOverhead: new Decimal("2400.00"),
      status: "COMPLETED" as const,
      voidedAt: null,
      voidReason: null,
      voidedById: null,
      createdAt: new Date("2026-10-29T10:00:00.000Z"),
      items: [
        {
          id: "item-1",
          saleId: "sale-1",
          menuId: "menu-hero",
          menuNameSnapshot: "Es Kopi Susu Aren",
          qty: 2,
          unitPrice: new Decimal("18000.00"),
          ingredientCostActual: new Decimal("15480.00"),
          overheadAllocated: new Decimal("2400.00"),
        },
      ],
    };

    it("successfully checks out a sale for OWNER with full cost snapshot", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
      vi.mocked(saleRepository.checkoutAtomic).mockResolvedValue(mockCreatedSale);

      const res = await request(app)
        .post("/api/sales")
        .set("Idempotency-Key", "idem-key-1")
        .send(validSalePayload);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);

      const data = res.body.data;
      expect(data.invoiceNo).toBe("INV-20261029-A1B2C3");
      expect(data.totalAmount).toBe("36000.00");
      // Cost fields present for OWNER
      expect(data.totalIngredientCost).toBe("15480.00");
      expect(data.totalOverhead).toBe("2400.00");
      expect(data.items).toHaveLength(1);
      expect(data.items[0].ingredientCostActual).toBe("15480.00");
      expect(data.items[0].overheadAllocated).toBe("2400.00");

      expect(saleRepository.checkoutAtomic).toHaveBeenCalledWith({
        businessId: mockBusinessId,
        cashierId: mockOwnerId,
        idempotencyKey: "idem-key-1",
        paymentMethod: "CASH",
        items: [{ menuId: "menu-hero", qty: 2 }],
        overheadPerPortion: expect.any(Decimal),
      });
    });

    it("successfully checks out a sale for CASHIER but strips cost fields (Rule 7, FR-AUTH-03)", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(cashierSession);
      vi.mocked(saleRepository.checkoutAtomic).mockResolvedValue({
        ...mockCreatedSale,
        cashierId: mockCashierId,
      });

      const res = await request(app)
        .post("/api/sales")
        .set("Idempotency-Key", "idem-key-cashier-1")
        .send(validSalePayload);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);

      const data = res.body.data;
      expect(data.invoiceNo).toBe("INV-20261029-A1B2C3");
      expect(data.totalAmount).toBe("36000.00");

      // Critical: Cost fields MUST NOT be present for CASHIER
      expect(data.totalIngredientCost).toBeUndefined();
      expect(data.totalOverhead).toBeUndefined();
      expect(data.items).toHaveLength(1);
      expect(data.items[0].ingredientCostActual).toBeUndefined();
      expect(data.items[0].overheadAllocated).toBeUndefined();
      expect(data.items[0].menuNameSnapshot).toBe("Es Kopi Susu Aren");
      expect(data.items[0].unitPrice).toBe("18000.00");
    });

    it("rejects request when Idempotency-Key header is missing", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(cashierSession);

      const res = await request(app)
        .post("/api/sales")
        // No Idempotency-Key header
        .send(validSalePayload);

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toContain("Idempotency-Key");
      expect(saleRepository.checkoutAtomic).not.toHaveBeenCalled();
    });

    it("returns existing sale idempotently without side-effects when key was already used", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
      // Repository returns the existing sale without creating duplicate rows
      vi.mocked(saleRepository.checkoutAtomic).mockResolvedValue(mockCreatedSale);

      const res = await request(app)
        .post("/api/sales")
        .set("Idempotency-Key", "idem-key-1")
        .send(validSalePayload);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.id).toBe("sale-1");
    });

    it("merges duplicate menuId lines in the shopping cart", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
      vi.mocked(saleRepository.checkoutAtomic).mockResolvedValue(mockCreatedSale);

      const payloadWithDuplicates = {
        paymentMethod: "QRIS",
        items: [
          { menuId: "menu-hero", qty: 2 },
          { menuId: "menu-hero", qty: 3 }, // duplicate menuId
        ],
      };

      const res = await request(app)
        .post("/api/sales")
        .set("Idempotency-Key", "idem-key-dup")
        .send(payloadWithDuplicates);

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);

      expect(saleRepository.checkoutAtomic).toHaveBeenCalledWith(
        expect.objectContaining({
          // Merged to 5 portions
          items: [{ menuId: "menu-hero", qty: 5 }],
          paymentMethod: "QRIS",
        })
      );
    });

    it("rejects empty items array with 400", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);

      const res = await request(app)
        .post("/api/sales")
        .set("Idempotency-Key", "idem-key-empty")
        .send({
          paymentMethod: "CASH",
          items: [],
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("handles InsufficientStockError and returns 409 INSUFFICIENT_STOCK with details", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(cashierSession);
      vi.mocked(saleRepository.checkoutAtomic).mockRejectedValue(
        new InsufficientStockError('Stok bahan "Biji Kopi" tidak mencukupi untuk pesanan', {
          ingredientId: "ing-kopi",
          ingredientName: "Biji Kopi",
          needed: "36.000",
          available: "20.000",
        })
      );

      const res = await request(app)
        .post("/api/sales")
        .set("Idempotency-Key", "idem-key-shortage")
        .send(validSalePayload);

      expect(res.status).toBe(409);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");
      expect(res.body.error.message).toContain("Biji Kopi");
    });
  });

  describe("GET /api/sales", () => {
    const mockSaleList = [
      {
        id: "sale-list-1",
        businessId: mockBusinessId,
        invoiceNo: "INV-20261029-L1",
        idempotencyKey: "key-list-1",
        soldAt: new Date("2026-10-29T10:00:00.000Z"),
        cashierId: mockCashierId,
        cashier: {
          id: mockCashierId,
          name: "Cashier Demo",
          role: "CASHIER",
        },
        paymentMethod: "CASH" as const,
        totalAmount: new Decimal("36000.00"),
        totalIngredientCost: new Decimal("15480.00"),
        totalOverhead: new Decimal("2000.00"),
        status: "COMPLETED" as const,
        voidedAt: null,
        voidReason: null,
        voidedById: null,
        createdAt: new Date("2026-10-29T10:00:00.000Z"),
        items: [
          {
            id: "item-l1",
            saleId: "sale-list-1",
            menuId: "menu-kopi",
            menuNameSnapshot: "Es Kopi Susu",
            qty: 2,
            unitPrice: new Decimal("18000.00"),
            ingredientCostActual: new Decimal("15480.00"),
            overheadAllocated: new Decimal("2000.00"),
          },
        ],
      },
    ];

    it("returns paginated sales for OWNER with cost breakdown and margin", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
      vi.mocked(saleRepository.findMany).mockResolvedValue({
        sales: mockSaleList,
        total: 1,
      });

      const res = await request(app).get("/api/sales?page=1&limit=10");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(10);
      expect(res.body.data.totalPages).toBe(1);

      const item = res.body.data.items[0];
      expect(item.id).toBe("sale-list-1");
      expect(item.totalAmount).toBe("36000.00");
      expect(item.totalIngredientCost).toBe("15480.00");
      expect(item.totalOverhead).toBe("2000.00");
      expect(item.grossMargin).toBe("18520.00");
      expect(item.marginPercentage).toBe("51.44");
      expect(item.cashier.name).toBe("Cashier Demo");
    });

    it("returns paginated sales for CASHIER stripping cost breakdown and margins", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(cashierSession);
      vi.mocked(saleRepository.findMany).mockResolvedValue({
        sales: mockSaleList,
        total: 1,
      });

      const res = await request(app).get("/api/sales?page=1&limit=10");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);

      const item = res.body.data.items[0];
      expect(item.id).toBe("sale-list-1");
      expect(item.totalAmount).toBe("36000.00");
      expect(item.totalIngredientCost).toBeUndefined();
      expect(item.totalOverhead).toBeUndefined();
      expect(item.grossMargin).toBeUndefined();
      expect(item.marginPercentage).toBeUndefined();
      expect(item.items[0].ingredientCostActual).toBeUndefined();
      expect(item.items[0].overheadAllocated).toBeUndefined();
    });

    it("passes filter query parameters to repository", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
      vi.mocked(saleRepository.findMany).mockResolvedValue({
        sales: [],
        total: 0,
      });

      const res = await request(app).get(
        "/api/sales?startDate=2026-10-01&endDate=2026-10-31&paymentMethod=CASH&status=COMPLETED"
      );

      expect(res.status).toBe(200);
      expect(saleRepository.findMany).toHaveBeenCalledWith(
        mockBusinessId,
        expect.objectContaining({
          status: "COMPLETED",
          paymentMethod: "CASH",
        })
      );
    });
  });

  describe("GET /api/sales/:id", () => {
    const mockSaleDetail = {
      id: "sale-detail-1",
      businessId: mockBusinessId,
      invoiceNo: "INV-20261029-X9Y8Z7",
      idempotencyKey: "key-det-1",
      soldAt: new Date("2026-10-29T11:00:00.000Z"),
      cashierId: mockOwnerId,
      paymentMethod: "TRANSFER" as const,
      totalAmount: new Decimal("50000.00"),
      totalIngredientCost: new Decimal("20000.00"),
      totalOverhead: new Decimal("3600.00"),
      status: "COMPLETED" as const,
      voidedAt: null,
      voidReason: null,
      voidedById: null,
      createdAt: new Date("2026-10-29T11:00:00.000Z"),
      items: [
        {
          id: "item-det-1",
          saleId: "sale-detail-1",
          menuId: "menu-americano",
          menuNameSnapshot: "Americano",
          qty: 2,
          unitPrice: new Decimal("25000.00"),
          ingredientCostActual: new Decimal("20000.00"),
          overheadAllocated: new Decimal("3600.00"),
        },
      ],
      movements: [
        {
          id: "mov-1",
          businessId: mockBusinessId,
          ingredientId: "ing-kopi",
          batchId: "batch-kopi-1",
          type: "SALE" as const,
          qtyBaseDelta: new Decimal("-36.000"),
          costPerBase: new Decimal("200.000000"),
          refType: "SALE_ITEM",
          refId: "item-det-1",
          ingredient: {
            id: "ing-kopi",
            name: "Biji Kopi",
            baseUnit: "GRAM",
          },
          batch: {
            id: "batch-kopi-1",
            expiryDate: new Date("2026-11-15T00:00:00.000Z"),
            purchaseUnit: "kg",
            purchaseUnitPrice: new Decimal("200000.00"),
            costPerBase: new Decimal("200.000000"),
          },
        },
      ],
    };

    it("returns sale detail for OWNER including cost breakdown and batch allocations", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
      vi.mocked(saleRepository.findById).mockResolvedValue(mockSaleDetail);

      const res = await request(app).get("/api/sales/sale-detail-1");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.id).toBe("sale-detail-1");
      expect(res.body.data.totalIngredientCost).toBe("20000.00");
      expect(res.body.data.totalOverhead).toBe("3600.00");
      expect(res.body.data.grossMargin).toBe("26400.00");
      expect(res.body.data.items[0].ingredientCostActual).toBe("20000.00");

      // Verify batch allocation costing for OWNER
      const allocs = res.body.data.items[0].batchAllocations;
      expect(allocs).toBeDefined();
      expect(allocs.length).toBe(1);
      expect(allocs[0].ingredientName).toBe("Biji Kopi");
      expect(allocs[0].qtyDeducted).toBe("36.000");
      expect(allocs[0].costPerBase).toBe("200.000000");
      expect(allocs[0].subtotalCost).toBe("7200.00");
    });

    it("returns sale detail for CASHIER stripping cost breakdown and batch allocation costs", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(cashierSession);
      vi.mocked(saleRepository.findById).mockResolvedValue(mockSaleDetail);

      const res = await request(app).get("/api/sales/sale-detail-1");

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.id).toBe("sale-detail-1");
      expect(res.body.data.totalIngredientCost).toBeUndefined();
      expect(res.body.data.totalOverhead).toBeUndefined();
      expect(res.body.data.grossMargin).toBeUndefined();
      expect(res.body.data.items[0].ingredientCostActual).toBeUndefined();

      // Verify batch allocation for CASHIER has operational details, but no cost fields
      const allocs = res.body.data.items[0].batchAllocations;
      expect(allocs).toBeDefined();
      expect(allocs.length).toBe(1);
      expect(allocs[0].ingredientName).toBe("Biji Kopi");
      expect(allocs[0].qtyDeducted).toBe("36.000");
      expect(allocs[0].costPerBase).toBeUndefined();
      expect(allocs[0].subtotalCost).toBeUndefined();
    });

    it("returns 404 when sale is not found", async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(ownerSession);
      vi.mocked(saleRepository.findById).mockResolvedValue(null);

      const res = await request(app).get("/api/sales/non-existent");

      expect(res.status).toBe(404);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });
});
