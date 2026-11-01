import {
  describeDb,
  createTestBusiness,
  cleanupBusinesses,
  disconnectDb,
  createTestIngredient,
  createTestBatch,
  createTestMenuWithRecipe,
} from "./helpers/index.js";
import { it, expect, afterEach, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../../src/create-app.js";
import { prisma } from "../../../src/lib/db.js";
import { auth } from "../../../src/lib/auth.js";
import { env } from "../../../src/config/env.js";
import { BaseUnit, IngredientCategory } from "../../../src/generated/prisma/enums.js";

function extractCookie(setCookie: string[] | string | undefined): string {
  if (!setCookie) return "";
  const list = Array.isArray(setCookie) ? setCookie : [setCookie];
  return list.map((c) => c.split(";")[0]).join("; ");
}

describeDb("Real DB & HTTP: PRD Lampiran A E2E Demo Scenario", () => {
  const app = createApp();
  const businessIds: string[] = [];

  afterEach(async () => {
    await cleanupBusinesses(businessIds);
    businessIds.length = 0;
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it("replicates Lampiran A: costing, POS checkout, price shock alert, price apply, and RBAC", async () => {
    // 1. Setup business according to Lampiran B
    const business = await createTestBusiness("lampiran-a");
    businessIds.push(business.id);

    // Update business settings: targetMargin 50%, expectedPortions 1300, step 500
    await prisma.business.update({
      where: { id: business.id },
      data: {
        targetMarginDefault: "50.00",
        expectedMonthlyPortions: 1300,
        priceRoundingStep: 500,
        expiryWarnDays: 3,
      },
    });

    // Monthly overhead: 1.560.000 / 1300 = 1.200 per portion using OverheadCost model
    await prisma.overheadCost.create({
      data: {
        businessId: business.id,
        name: "Listrik, Gas & Penyusutan",
        type: "UTILITY",
        monthlyAmount: "1560000.00",
        isActive: true,
      },
    });

    // Users: Owner and Cashier via Better Auth
    const timestamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const ownerEmail = `owner-${timestamp}@example.test`;
    const cashierEmail = `cashier-${timestamp}@example.test`;
    const testPassword = "Password123!";

    const ownerAuth = await auth.api.signUpEmail({
      body: {
        email: ownerEmail,
        password: testPassword,
        name: "Demo Owner",
      },
    });
    if (!ownerAuth?.user) throw new Error("Gagal membuat user owner");

    await prisma.user.update({
      where: { id: ownerAuth.user.id },
      data: {
        businessId: business.id,
        role: "OWNER",
        isActive: true,
      },
    });

    const cashierAuth = await auth.api.signUpEmail({
      body: {
        email: cashierEmail,
        password: testPassword,
        name: "Demo Cashier",
      },
    });
    if (!cashierAuth?.user) throw new Error("Gagal membuat user cashier");

    await prisma.user.update({
      where: { id: cashierAuth.user.id },
      data: {
        businessId: business.id,
        role: "CASHIER",
        isActive: true,
      },
    });

    // Authenticate via real HTTP endpoint POST /api/auth/sign-in/email
    const ownerSignInRes = await request(app)
      .post("/api/auth/sign-in/email")
      .set("Origin", env.FRONTEND_URL)
      .send({
        email: ownerEmail,
        password: testPassword,
      });
    expect(ownerSignInRes.status).toBe(200);

    const cashierSignInRes = await request(app)
      .post("/api/auth/sign-in/email")
      .set("Origin", env.FRONTEND_URL)
      .send({
        email: cashierEmail,
        password: testPassword,
      });
    expect(cashierSignInRes.status).toBe(200);

    const ownerCookie = extractCookie(ownerSignInRes.headers["set-cookie"]);
    const cashierCookie = extractCookie(cashierSignInRes.headers["set-cookie"]);

    // 2. Setup Ingredients for Es Kopi Susu Aren:
    // Biji Kopi: 180/g
    const kopi = await createTestIngredient({
      businessId: business.id,
      name: "Biji Kopi",
      category: IngredientCategory.MAIN,
      baseUnit: BaseUnit.G,
      yieldPercent: 100,
    });
    await createTestBatch({
      businessId: business.id,
      ingredientId: kopi.id,
      remainingQtyBase: 5000,
      costPerBase: "180.000000",
    });

    // Susu UHT: 18/ml (18.000/L) - Batch A expiring in 2 days (H+2)
    const now = new Date();
    const susu = await createTestIngredient({
      businessId: business.id,
      name: "Susu UHT",
      category: IngredientCategory.MAIN,
      baseUnit: BaseUnit.ML,
      yieldPercent: 100,
    });
    const batchSusuA = await createTestBatch({
      businessId: business.id,
      ingredientId: susu.id,
      expiryDate: new Date(now.getTime() + 2 * 86400000), // H+2
      remainingQtyBase: 10000,
      costPerBase: "18.000000",
    });

    // Gula Aren: 40/ml
    const aren = await createTestIngredient({
      businessId: business.id,
      name: "Gula Aren Cair",
      category: IngredientCategory.MAIN,
      baseUnit: BaseUnit.ML,
      yieldPercent: 100,
    });
    await createTestBatch({
      businessId: business.id,
      ingredientId: aren.id,
      remainingQtyBase: 2000,
      costPerBase: "40.000000",
    });

    // Cup Set: 700/pcs
    const cup = await createTestIngredient({
      businessId: business.id,
      name: "Cup Set",
      category: IngredientCategory.PACKAGING,
      baseUnit: BaseUnit.PCS,
      yieldPercent: 100,
    });
    await createTestBatch({
      businessId: business.id,
      ingredientId: cup.id,
      remainingQtyBase: 1000,
      costPerBase: "700.000000",
    });

    // Es Batu: 6/g
    const es = await createTestIngredient({
      businessId: business.id,
      name: "Es Batu",
      category: IngredientCategory.SUPPORT,
      baseUnit: BaseUnit.G,
      yieldPercent: 100,
    });
    await createTestBatch({
      businessId: business.id,
      ingredientId: es.id,
      remainingQtyBase: 5000,
      costPerBase: "6.000000",
    });

    // 3. Create Menu "Es Kopi Susu Aren" with recipe:
    // 18g Kopi (3240) + 150ml Susu (2700) + 20ml Aren (800) + 1 Cup (700) + 50g Es (300) = 7.740
    // Selling price: 18.000
    const menu = await createTestMenuWithRecipe({
      businessId: business.id,
      name: "Es Kopi Susu Aren",
      sellingPrice: "18000.00",
      isActive: true,
      recipeItems: [
        { ingredientId: kopi.id, qtyUsableBase: 18 },
        { ingredientId: susu.id, qtyUsableBase: 150 },
        { ingredientId: aren.id, qtyUsableBase: 20 },
        { ingredientId: cup.id, qtyUsableBase: 1 },
        { ingredientId: es.id, qtyUsableBase: 50 },
      ],
    });

    // Verify Costing API (GET /api/menus/:id/cost)
    const costRes = await request(app)
      .get(`/api/menus/${menu.id}/cost`)
      .set("Cookie", ownerCookie);

    expect(costRes.status).toBe(200);
    expect(costRes.body.ok).toBe(true);
    // HPP Bahan = 7.740, HPP Penuh = 7.740 + 1.200 = 8.940
    expect(costRes.body.data.hppBahan).toBe("7740.00");
    expect(costRes.body.data.hppPenuh).toBe("8940.00");
    expect(costRes.body.data.marginPercent).toBe("50.33");
    expect(costRes.body.data.marginStatus).toBe("AMAN");

    // 4. POS Checkout: 5 cups Es Kopi Susu via CASHIER
    const checkoutRes = await request(app)
      .post("/api/sales")
      .set("Cookie", cashierCookie)
      .set("Origin", env.FRONTEND_URL)
      .set("Idempotency-Key", "demo-checkout-5-cups")
      .send({
        paymentMethod: "CASH",
        items: [{ menuId: menu.id, qty: 5 }],
      });

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.ok).toBe(true);
    // 5 * 18.000 = 90.000
    expect(checkoutRes.body.data.totalAmount).toBe("90000.00");

    // Check batch A stock depleted by 5 * 150ml = 750ml -> 10000 - 750 = 9250ml
    const batchSusuAfter = await prisma.stockBatch.findUniqueOrThrow({
      where: { id: batchSusuA.id },
    });
    expect(Number(batchSusuAfter.remainingQtyBase)).toBe(9250);

    // 5. Purchase Input: Susu UHT 10L @ Rp24.000/L (Rp24/ml) -> Price shock!
    const purchaseRes = await request(app)
      .post("/api/purchases")
      .set("Cookie", ownerCookie)
      .set("Origin", env.FRONTEND_URL)
      .send({
        supplierName: "Distributor Susu Baru",
        purchasedAt: new Date().toISOString(),
        items: [
          {
            ingredientId: susu.id,
            purchaseQty: 10,
            purchaseUnit: "ml",
            purchaseUnitPrice: 24, // Rp24/ml = Rp24.000/L
            expiryDate: new Date(now.getTime() + 14 * 86400000).toISOString().split("T")[0],
          },
        ],
      });

    expect(purchaseRes.status).toBe(201);
    expect(purchaseRes.body.ok).toBe(true);

    // The purchase response returns triggered price shock alerts
    const alerts = purchaseRes.body.data.priceShockAlerts;
    expect(alerts).toBeDefined();
    expect(alerts).toHaveLength(1);

    const alertItem = alerts[0];
    expect(alertItem.menuName).toBe("Es Kopi Susu Aren");
    // HPP Bahan increases to 8.640, HPP Penuh increases to 9.840
    expect(alertItem.costAfter.hppBahan).toBe("8640.00");
    expect(alertItem.costAfter.hppPenuh).toBe("9840.00");
    // Full margin drops to 45.33% (< 50% target)
    expect(alertItem.costAfter.marginPercent).toBe("45.33");
    // Option A: Recommended price = Rp20.000
    expect(alertItem.optionA.recommendedPrice).toBe("20000.00");
    // Option B: Portion reduced from 150ml to 115ml
    expect(alertItem.optionB.newTakaran).toContain("115");

    // 6. Owner views alert detail (GET /api/alerts/:id)
    const alertDetailRes = await request(app)
      .get(`/api/alerts/${alertItem.alertId}`)
      .set("Cookie", ownerCookie);

    expect(alertDetailRes.status).toBe(200);
    expect(alertDetailRes.body.ok).toBe(true);
    expect(alertDetailRes.body.data.optionA.recommendedPrice).toBe("20000.00");
    expect(alertDetailRes.body.data.optionB.newTakaran).toContain("115");
    expect(alertDetailRes.body.data.optionB.currentTakaran).toContain("150");

    // 7. Owner applies recommended price (POST /api/alerts/:id/apply-price)
    const applyRes = await request(app)
      .post(`/api/alerts/${alertItem.alertId}/apply-price`)
      .set("Cookie", ownerCookie)
      .set("Origin", env.FRONTEND_URL);

    expect(applyRes.status).toBe(200);
    expect(applyRes.body.ok).toBe(true);
    expect(applyRes.body.data.status).toBe("RESOLVED");
    expect(applyRes.body.data.resolution).toBe("PRICE_RAISED");

    // Verify menu selling price is now 20.000 in DB
    const updatedMenu = await prisma.menu.findUniqueOrThrow({
      where: { id: menu.id },
    });
    expect(Number(updatedMenu.sellingPrice)).toBe(20000);

    // 8. RBAC checks: CASHIER must receive 403 on Alerts and Dashboard
    const cashierAlertsRes = await request(app)
      .get("/api/alerts")
      .set("Cookie", cashierCookie);
    expect(cashierAlertsRes.status).toBe(403);
    expect(cashierAlertsRes.body.error.code).toBe("FORBIDDEN");

    const cashierDashboardRes = await request(app)
      .get("/api/dashboard/summary")
      .set("Cookie", cashierCookie);
    expect(cashierDashboardRes.status).toBe(403);
    expect(cashierDashboardRes.body.error.code).toBe("FORBIDDEN");
  });
});
