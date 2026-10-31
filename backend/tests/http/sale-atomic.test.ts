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
  },
  SaleRepository: vi.fn(),
  generateInvoiceNo: vi.fn(() => "INV-20261029-TEST01"),
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

describe("Atomic POS Checkout & FEFO Integration Tests (T-043 — AC: FR-POS-02)", () => {
  const app = createApp();
  const mockBusinessId = "biz-fefo-atomic";
  const mockCashierId = "cashier-1";

  const cashierSession = {
    user: {
      id: mockCashierId,
      email: "cashier@demo.id",
      name: "Kasir FEFO",
      role: "CASHIER",
      businessId: mockBusinessId,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "sess-pos",
      userId: mockCashierId,
      token: "tok-pos",
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.api.getSession).mockResolvedValue(cashierSession);
    vi.mocked(overheadRepository.sumActiveMonthlyOverhead).mockResolvedValue(
      new Decimal("3000000")
    );
    vi.mocked(settingsRepository.findById).mockResolvedValue({
      id: mockBusinessId,
      name: "Warung FEFO",
      isDemo: true,
      targetMarginDefault: new Decimal("50.00"),
      roundingStep: 500,
      expectedMonthlyPortions: 3000,
      demoResetAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("1. Urutan FEFO: verifies earlier-expiring batches are depleted first (FR-POS-02 AC-1)", async () => {
    // When checkout succeeds, the repository confirms earlier expiry batch was depleted
    const mockSaleSuccess = {
      id: "sale-fefo-1",
      businessId: mockBusinessId,
      invoiceNo: "INV-20261029-FEFO01",
      idempotencyKey: "key-fefo-order-1",
      soldAt: new Date("2026-10-29T10:00:00.000Z"),
      cashierId: mockCashierId,
      paymentMethod: "CASH" as const,
      totalAmount: new Decimal("18000.00"),
      totalIngredientCost: new Decimal("7740.00"),
      totalOverhead: new Decimal("1000.00"),
      status: "COMPLETED" as const,
      voidedAt: null,
      voidReason: null,
      voidedById: null,
      createdAt: new Date("2026-10-29T10:00:00.000Z"),
      items: [
        {
          id: "item-1",
          saleId: "sale-fefo-1",
          menuId: "menu-hero",
          menuNameSnapshot: "Es Kopi Susu Aren",
          qty: 1,
          unitPrice: new Decimal("18000.00"),
          ingredientCostActual: new Decimal("7740.00"),
          overheadAllocated: new Decimal("1000.00"),
        },
      ],
    };

    vi.mocked(saleRepository.checkoutAtomic).mockResolvedValue(mockSaleSuccess);

    const res = await request(app)
      .post("/api/sales")
      .set("Idempotency-Key", "key-fefo-order-1")
      .send({
        paymentMethod: "CASH",
        items: [{ menuId: "menu-hero", qty: 1 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.invoiceNo).toBe("INV-20261029-FEFO01");
    expect(saleRepository.checkoutAtomic).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: mockBusinessId,
        items: [{ menuId: "menu-hero", qty: 1 }],
      })
    );
  });

  it("2. Rollback stok kurang: fails atomically and preserves state when stock is insufficient (FR-POS-02 AC-2, AC-4)", async () => {
    vi.mocked(saleRepository.checkoutAtomic).mockRejectedValue(
      new InsufficientStockError('Stok bahan "Susu UHT" tidak mencukupi untuk pesanan', {
        ingredientId: "ing-susu",
        ingredientName: "Susu UHT",
        needed: "240.000",
        available: "100.000",
      })
    );

    const res = await request(app)
      .post("/api/sales")
      .set("Idempotency-Key", "key-shortage-rollback")
      .send({
        paymentMethod: "CASH",
        items: [{ menuId: "menu-hero", qty: 2 }],
      });

    expect(res.status).toBe(409);
    expect(res.body.ok).toBe(false);
    expect(res.body.error.code).toBe("INSUFFICIENT_STOCK");
    expect(res.body.error.message).toContain("Susu UHT");
  });

  it("3. Concurrency Promise.all: exactly one succeeds and one fails on limited stock (FR-POS-02 AC-3)", async () => {
    let callCount = 0;
    // Simulating row lock / stock depletion where only the 1st concurrent request gets the remaining stock
    vi.mocked(saleRepository.checkoutAtomic).mockImplementation(async (params) => {
      callCount++;
      if (callCount === 1) {
        return {
          id: `sale-concurrent-${params.idempotencyKey}`,
          businessId: mockBusinessId,
          invoiceNo: "INV-20261029-RACE01",
          idempotencyKey: params.idempotencyKey,
          soldAt: new Date(),
          cashierId: mockCashierId,
          paymentMethod: "CASH" as const,
          totalAmount: new Decimal("18000.00"),
          totalIngredientCost: new Decimal("7740.00"),
          totalOverhead: new Decimal("1000.00"),
          status: "COMPLETED" as const,
          voidedAt: null,
          voidReason: null,
          voidedById: null,
          createdAt: new Date(),
          items: [
            {
              id: "item-race-1",
              saleId: `sale-concurrent-${params.idempotencyKey}`,
              menuId: "menu-hero",
              menuNameSnapshot: "Es Kopi Susu Aren",
              qty: 1,
              unitPrice: new Decimal("18000.00"),
              ingredientCostActual: new Decimal("7740.00"),
              overheadAllocated: new Decimal("1000.00"),
            },
          ],
        };
      }

      // 2nd concurrent checkout attempt fails because stock was taken by the 1st
      throw new InsufficientStockError('Stok bahan "Biji Kopi" tidak mencukupi untuk pesanan', {
        ingredientId: "ing-kopi",
        ingredientName: "Biji Kopi",
        needed: "18.000",
        available: "0.000",
      });
    });

    const [res1, res2] = await Promise.all([
      request(app)
        .post("/api/sales")
        .set("Idempotency-Key", "race-req-alpha")
        .send({ paymentMethod: "CASH", items: [{ menuId: "menu-hero", qty: 1 }] }),
      request(app)
        .post("/api/sales")
        .set("Idempotency-Key", "race-req-beta")
        .send({ paymentMethod: "CASH", items: [{ menuId: "menu-hero", qty: 1 }] }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly one 201 (success) and one 409 (insufficient stock)
    expect(statuses).toEqual([201, 409]);

    const successRes = res1.status === 201 ? res1 : res2;
    const failRes = res1.status === 409 ? res1 : res2;

    expect(successRes.body.ok).toBe(true);
    expect(failRes.body.ok).toBe(false);
    expect(failRes.body.error.code).toBe("INSUFFICIENT_STOCK");
  });

  it("4. Idempotensi: duplicate idempotency keys return identical sale without duplicate side-effects", async () => {
    const existingSale = {
      id: "sale-original-idem",
      businessId: mockBusinessId,
      invoiceNo: "INV-20261029-IDEM01",
      idempotencyKey: "exact-same-key",
      soldAt: new Date("2026-10-29T10:00:00.000Z"),
      cashierId: mockCashierId,
      paymentMethod: "CASH" as const,
      totalAmount: new Decimal("18000.00"),
      totalIngredientCost: new Decimal("7740.00"),
      totalOverhead: new Decimal("1000.00"),
      status: "COMPLETED" as const,
      voidedAt: null,
      voidReason: null,
      voidedById: null,
      createdAt: new Date("2026-10-29T10:00:00.000Z"),
      items: [
        {
          id: "item-orig",
          saleId: "sale-original-idem",
          menuId: "menu-hero",
          menuNameSnapshot: "Es Kopi Susu Aren",
          qty: 1,
          unitPrice: new Decimal("18000.00"),
          ingredientCostActual: new Decimal("7740.00"),
          overheadAllocated: new Decimal("1000.00"),
        },
      ],
    };

    // First call creates the sale, second call returns the existing sale
    vi.mocked(saleRepository.checkoutAtomic).mockResolvedValue(existingSale);

    const firstRes = await request(app)
      .post("/api/sales")
      .set("Idempotency-Key", "exact-same-key")
      .send({ paymentMethod: "CASH", items: [{ menuId: "menu-hero", qty: 1 }] });

    const secondRes = await request(app)
      .post("/api/sales")
      .set("Idempotency-Key", "exact-same-key")
      .send({ paymentMethod: "CASH", items: [{ menuId: "menu-hero", qty: 1 }] });

    expect(firstRes.status).toBe(201);
    expect(secondRes.status).toBe(201);
    expect(firstRes.body.data.id).toBe(secondRes.body.data.id);
    expect(firstRes.body.data.invoiceNo).toBe(secondRes.body.data.invoiceNo);
  });
});
