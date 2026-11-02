import { describeDb, cleanupBusinesses, disconnectDb } from "./helper.js";
import { it, expect, afterEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../../src/create-app.js";
import { prisma } from "../../../src/lib/db.js";
import { env } from "../../../src/config/env.js";
import { seedDemo } from "../../../src/seed/seed-demo.js";

function extractCookie(setCookie: string[] | string | undefined): string {
  if (!setCookie) return "";
  const list = Array.isArray(setCookie) ? setCookie : [setCookie];
  return list.map((c) => c.split(";")[0]).join("; ");
}

describeDb("Real DB: Deterministic Seed & Lampiran A Scenario Verification", () => {
  const app = createApp();
  const testBusinessId = `test-seed-${Date.now()}`;
  const testPassword = "DemoPassword123!";

  afterEach(async () => {
    await cleanupBusinesses([testBusinessId]);
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it("seeds full PRD Lampiran B fixture, 1.300 historical sales, and verifies price shock alert", async () => {
    // 1. Run full deterministic seed on the isolated test business
    await seedDemo({
      businessId: testBusinessId,
      customPassword: testPassword,
      deleteUsers: true,
    });

    // 2. Verify business parameters
    const biz = await prisma.business.findUniqueOrThrow({
      where: { id: testBusinessId },
    });
    expect(biz.isDemo).toBe(true);
    expect(biz.expectedMonthlyPortions).toBe(1300);
    expect(Number(biz.targetMarginDefault)).toBe(50);
    expect(biz.priceRoundingStep).toBe(500);

    // 3. Verify overhead costs: 3 records totaling 1.560.000
    const overheads = await prisma.overheadCost.findMany({
      where: { businessId: testBusinessId, isActive: true },
    });
    expect(overheads).toHaveLength(3);
    const totalOvh = overheads.reduce((sum, o) => sum + Number(o.monthlyAmount), 0);
    expect(totalOvh).toBe(1560000);

    // 4. Verify 16 ingredients and 6 menus
    const ingredientCount = await prisma.ingredient.count({
      where: { businessId: testBusinessId },
    });
    expect(ingredientCount).toBe(16);

    const menuCount = await prisma.menu.count({
      where: { businessId: testBusinessId },
    });
    expect(menuCount).toBe(6);

    // 5. Verify historical sales: exactly 1.300 portions
    const saleItems = await prisma.saleItem.findMany({
      where: { sale: { businessId: testBusinessId } },
      select: { qty: true },
    });
    const totalPortionsSeeded = saleItems.reduce((sum, item) => sum + item.qty, 0);
    expect(totalPortionsSeeded).toBe(1300);

    // 6. Verify opening stock batches: Susu UHT H+2, Croissant expired, Gula Aren below minStock
    const susuIng = await prisma.ingredient.findUniqueOrThrow({
      where: { businessId_nameKey: { businessId: testBusinessId, nameKey: "susu uht" } },
    });
    const susuBatch = await prisma.stockBatch.findFirstOrThrow({
      where: { businessId: testBusinessId, ingredientId: susuIng.id },
    });
    expect(Number(susuBatch.remainingQtyBase)).toBe(10000);
    expect(susuBatch.expiryDate).not.toBeNull();

    const croissantIng = await prisma.ingredient.findUniqueOrThrow({
      where: { businessId_nameKey: { businessId: testBusinessId, nameKey: "croissant beku" } },
    });
    const expiredCroissantBatch = await prisma.stockBatch.findFirst({
      where: {
        businessId: testBusinessId,
        ingredientId: croissantIng.id,
        expiryDate: { lt: new Date() },
      },
    });
    expect(expiredCroissantBatch).not.toBeNull();
    expect(Number(expiredCroissantBatch!.remainingQtyBase)).toBe(4);

    const arenIng = await prisma.ingredient.findUniqueOrThrow({
      where: { businessId_nameKey: { businessId: testBusinessId, nameKey: "gula aren cair" } },
    });
    const arenBatch = await prisma.stockBatch.findFirstOrThrow({
      where: { businessId: testBusinessId, ingredientId: arenIng.id },
    });
    expect(Number(arenBatch.remainingQtyBase)).toBeLessThan(Number(arenIng.minStockBase));

    // 7. Authenticate Demo Owner to test Lampiran A HTTP endpoints
    const loginRes = await request(app)
      .post("/api/auth/sign-in/email")
      .set("Origin", env.FRONTEND_URL)
      .send({
        email: "owner@takarlaba.demo",
        password: testPassword,
      });

    expect(loginRes.status).toBe(200);
    const ownerCookie = extractCookie(loginRes.headers["set-cookie"]);
    expect(ownerCookie).toBeTruthy();

    // 8. Costing verification for Es Kopi Susu Aren: HPP Bahan 7.740, HPP Penuh 8.940
    const kopiSusuMenu = await prisma.menu.findUniqueOrThrow({
      where: { businessId_nameKey: { businessId: testBusinessId, nameKey: "es kopi susu aren" } },
    });

    const costRes = await request(app)
      .get(`/api/menus/${kopiSusuMenu.id}/cost`)
      .set("Cookie", ownerCookie);

    expect(costRes.status).toBe(200);
    expect(costRes.body.ok).toBe(true);
    expect(costRes.body.data.hppBahan).toBe("7740.00");
    expect(costRes.body.data.hppPenuh).toBe("8940.00");
    expect(costRes.body.data.marginPercent).toBe("50.33");
    expect(costRes.body.data.marginStatus).toBe("AMAN");

    // 9. Lampiran A Price Shock: Purchase Susu UHT @ Rp24.000/L (Rp24/ml)
    const purchaseRes = await request(app)
      .post("/api/purchases")
      .set("Cookie", ownerCookie)
      .set("Origin", env.FRONTEND_URL)
      .send({
        supplierName: "Pemasok Susu Lampiran A",
        purchasedAt: new Date().toISOString(),
        items: [
          {
            ingredientId: susuIng.id,
            purchaseQty: 10,
            purchaseUnit: "ml",
            purchaseUnitPrice: 24, // Rp24/ml
            expiryDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          },
        ],
      });

    expect(purchaseRes.status).toBe(201);
    expect(purchaseRes.body.ok).toBe(true);

    const alerts = purchaseRes.body.data.priceShockAlerts;
    expect(alerts).toBeDefined();
    expect(alerts).toHaveLength(1);

    const alert = alerts[0];
    expect(alert.menuName).toBe("Es Kopi Susu Aren");
    expect(alert.costAfter.hppBahan).toBe("8640.00");
    expect(alert.costAfter.hppPenuh).toBe("9840.00");
    expect(alert.costAfter.marginPercent).toBe("45.33");
    expect(alert.optionA.recommendedPrice).toBe("20000.00");
    expect(alert.optionB.newTakaran).toContain("115");

    // 10. Apply recommended price: changes price to 20.000 and resolves alert
    const applyRes = await request(app)
      .post(`/api/alerts/${alert.alertId}/apply-price`)
      .set("Cookie", ownerCookie)
      .set("Origin", env.FRONTEND_URL)
      .send({});

    expect(applyRes.status).toBe(200);
    expect(applyRes.body.ok).toBe(true);
    expect(applyRes.body.data.status).toBe("RESOLVED");
    expect(applyRes.body.data.resolution).toBe("PRICE_RAISED");

    // Verify menu selling price is now 20.000 in DB
    const updatedMenu = await prisma.menu.findUniqueOrThrow({
      where: { id: kopiSusuMenu.id },
    });
    expect(Number(updatedMenu.sellingPrice)).toBe(20000);
  });
});
