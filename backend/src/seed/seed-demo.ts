import { prisma } from "../lib/db.js";
import { auth } from "../lib/auth.js";
import { logger } from "../lib/logger.js";
import { todayWIB } from "../lib/date.js";
import {
  DEMO_BUSINESS_ID,
  DEMO_BUSINESS_SETTINGS,
  DEMO_OVERHEAD_COSTS,
  DEMO_INGREDIENTS,
  DEMO_MENUS,
  DEMO_OPENING_BATCHES,
} from "./fixture-data.js";
import { generate30DaySales } from "./sales-generator.js";

export function getDemoPassword(fallback?: string): string {
  const password = process.env.DEMO_PASSWORD || fallback;
  if (!password || password.trim() === "") {
    throw new Error("DEMO_PASSWORD environment variable is required to run seed");
  }
  return password;
}

export function getDemoUsers(password: string) {
  return [
    {
      email: "owner@takarlaba.demo",
      password,
      name: "Demo Pemilik",
      role: "OWNER" as const,
    },
    {
      email: "kasir@takarlaba.demo",
      password,
      name: "Demo Kasir",
      role: "CASHIER" as const,
    },
  ];
}

export const DEMO_USERS = getDemoUsers("placeholder-password");

export async function seedV0() {
  const password = getDemoPassword("DemoPassword123!");
  const demoUsers = getDemoUsers(password);

  const business = await prisma.business.upsert({
    where: { id: DEMO_BUSINESS_ID },
    update: {
      name: "Kopi Takar Laba (Demo)",
      isDemo: true,
      targetMarginDefault: 50.0,
      expiryWarnDays: 3,
      priceRoundingStep: 500,
      expectedMonthlyPortions: 1000,
      wastePromoMinMargin: 10.0,
      timezone: "Asia/Jakarta",
    },
    create: {
      id: DEMO_BUSINESS_ID,
      name: "Kopi Takar Laba (Demo)",
      isDemo: true,
      targetMarginDefault: 50.0,
      expiryWarnDays: 3,
      priceRoundingStep: 500,
      expectedMonthlyPortions: 1000,
      wastePromoMinMargin: 10.0,
      timezone: "Asia/Jakarta",
    },
  });

  for (const demoUser of demoUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: demoUser.email },
    });

    if (existingUser) {
      if (existingUser.businessId === business.id || !existingUser.businessId) {
        await prisma.user.delete({ where: { id: existingUser.id } });
      }
    }

    const created = await auth.api.signUpEmail({
      body: {
        email: demoUser.email,
        password: demoUser.password,
        name: demoUser.name,
      },
    });

    if (!created?.user) {
      throw new Error(`Gagal membuat akun Better Auth untuk ${demoUser.email}`);
    }

    await prisma.user.update({
      where: { id: created.user.id },
      data: {
        businessId: business.id,
        role: demoUser.role,
        name: demoUser.name,
        isActive: true,
        emailVerified: true,
      },
    });
  }
}

/**
 * Cleans up all child tables for the demo business in proper topological foreign key order.
 * Strictly scoped to isDemo=true (Rule 20).
 */
export async function cleanDemoBusiness(businessId = DEMO_BUSINESS_ID, deleteUsers = false) {
  const existingBiz = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, isDemo: true },
  });

  if (existingBiz && !existingBiz.isDemo) {
    throw new Error("Security violation: Refusing to clean non-demo business");
  }

  if (!existingBiz) {
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      // 1. SaleItem
      await tx.saleItem.deleteMany({
        where: { sale: { businessId } },
      });

      // 2. Sale
      await tx.sale.deleteMany({
        where: { businessId },
      });

      // 3. StockMovement
      await tx.stockMovement.deleteMany({
        where: { businessId },
      });

      // 4. MarginAlert
      await tx.marginAlert.deleteMany({
        where: { businessId },
      });

      // 5. MenuPriceHistory
      await tx.menuPriceHistory.deleteMany({
        where: { menu: { businessId } },
      });

      // 6. RecipeItem
      await tx.recipeItem.deleteMany({
        where: { menu: { businessId } },
      });

      // 7. Menu
      await tx.menu.deleteMany({
        where: { businessId },
      });

      // 8. OverheadCost
      await tx.overheadCost.deleteMany({
        where: { businessId },
      });

      // 9. StockBatch
      await tx.stockBatch.deleteMany({
        where: { businessId },
      });

      // 10. Purchase
      await tx.purchase.deleteMany({
        where: { businessId },
      });

      // 11. IngredientUnit
      await tx.ingredientUnit.deleteMany({
        where: { ingredient: { businessId } },
      });

      // 12. Ingredient
      await tx.ingredient.deleteMany({
        where: { businessId },
      });

      // 13. Users (optional, e.g. for complete teardown)
      if (deleteUsers) {
        await tx.session.deleteMany({
          where: { user: { businessId } },
        });
        await tx.account.deleteMany({
          where: { user: { businessId } },
        });
        await tx.user.deleteMany({
          where: { businessId },
        });
      }
    },
    { maxWait: 10000, timeout: 60000 }
  );

  logger.info({ businessId }, "Data bisnis demo berhasil dibersihkan");
}

export interface SeedDemoOptions {
  businessId?: string;
  customPassword?: string;
  referenceDate?: Date;
  deleteUsers?: boolean;
}

/**
 * Deterministically seeds the full PRD Lampiran A & B fixture for the demo business.
 */
export async function seedDemo(options: SeedDemoOptions = {}) {
  const businessId = options.businessId ?? DEMO_BUSINESS_ID;
  const password = options.customPassword ?? getDemoPassword("DemoPassword123!");
  const refDate = options.referenceDate ?? todayWIB();

  logger.info({ businessId }, "Memulai eksekusi seed deterministik bisnis demo...");

  // 1. Clean existing domain data for this demo business
  await cleanDemoBusiness(businessId, options.deleteUsers ?? false);

  // 2. Upsert demo business
  const business = await prisma.business.upsert({
    where: { id: businessId },
    update: {
      name: DEMO_BUSINESS_SETTINGS.name,
      isDemo: true,
      targetMarginDefault: DEMO_BUSINESS_SETTINGS.targetMarginDefault,
      priceRoundingStep: DEMO_BUSINESS_SETTINGS.priceRoundingStep,
      expiryWarnDays: DEMO_BUSINESS_SETTINGS.expiryWarnDays,
      expectedMonthlyPortions: DEMO_BUSINESS_SETTINGS.expectedMonthlyPortions,
      wastePromoMinMargin: DEMO_BUSINESS_SETTINGS.wastePromoMinMargin,
      timezone: DEMO_BUSINESS_SETTINGS.timezone,
    },
    create: {
      id: businessId,
      name: DEMO_BUSINESS_SETTINGS.name,
      isDemo: true,
      targetMarginDefault: DEMO_BUSINESS_SETTINGS.targetMarginDefault,
      priceRoundingStep: DEMO_BUSINESS_SETTINGS.priceRoundingStep,
      expiryWarnDays: DEMO_BUSINESS_SETTINGS.expiryWarnDays,
      expectedMonthlyPortions: DEMO_BUSINESS_SETTINGS.expectedMonthlyPortions,
      wastePromoMinMargin: DEMO_BUSINESS_SETTINGS.wastePromoMinMargin,
      timezone: DEMO_BUSINESS_SETTINGS.timezone,
    },
  });

  // 3. Ensure demo users exist
  const demoUsers = getDemoUsers(password);
  let cashierUserId = "demo-cashier-id";

  for (const demoUser of demoUsers) {
    let user = await prisma.user.findUnique({
      where: { email: demoUser.email },
    });

    if (!user) {
      const created = await auth.api.signUpEmail({
        body: {
          email: demoUser.email,
          password: demoUser.password,
          name: demoUser.name,
        },
      });

      if (!created?.user) {
        throw new Error(`Gagal membuat akun Better Auth untuk ${demoUser.email}`);
      }
      user = await prisma.user.findUnique({ where: { id: created.user.id } });
    }

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          businessId: business.id,
          role: demoUser.role,
          name: demoUser.name,
          isActive: true,
          emailVerified: true,
        },
      });

      if (demoUser.role === "CASHIER") {
        cashierUserId = user.id;
      }
    }
  }

  // 4. Seed overheads, ingredients, units, menus, recipes, sales, and batches inside a single high-performance transaction
  await prisma.$transaction(
    async (tx) => {
      // 4a. Overhead costs (batch insert)
      const overheadData = DEMO_OVERHEAD_COSTS.map((ovh) => ({
        id: `${businessId}-${ovh.id}`,
        businessId: business.id,
        name: ovh.name,
        type: ovh.type,
        monthlyAmount: ovh.monthlyAmount,
        isActive: ovh.isActive,
      }));
      await tx.overheadCost.createMany({ data: overheadData });

      // 4b. Ingredients & units (batch insert)
      const ingIdMap = new Map<string, string>();
      const ingredientData = [];
      const unitData = [];

      for (const ing of DEMO_INGREDIENTS) {
        const actualIngId = `${businessId}-${ing.id}`;
        ingIdMap.set(ing.id, actualIngId);

        ingredientData.push({
          id: actualIngId,
          businessId: business.id,
          name: ing.name,
          nameKey: ing.nameKey,
          category: ing.category,
          baseUnit: ing.baseUnit,
          yieldPercent: ing.yieldPercent,
          isPerishable: ing.isPerishable,
          minStockBase: ing.minStockBase,
          isActive: true,
        });

        for (const u of ing.units) {
          unitData.push({
            ingredientId: actualIngId,
            name: u.name,
            toBaseFactor: u.toBaseFactor,
          });
        }
      }
      await tx.ingredient.createMany({ data: ingredientData });
      await tx.ingredientUnit.createMany({ data: unitData });

      // 4c. Menus & recipes (batch insert)
      // Menus are backdated 45 days so they are mature (age >= 14 days) for Menu Engineering classification (BR-10, FR-MEG-01)
      const menuCreatedAt = new Date(refDate.getTime() - 45 * 24 * 60 * 60 * 1000);
      const menuIdMap = new Map<string, string>();
      const menuData = [];
      const recipeItemData = [];

      for (const menu of DEMO_MENUS) {
        const actualMenuId = `${businessId}-${menu.id}`;
        menuIdMap.set(menu.id, actualMenuId);

        menuData.push({
          id: actualMenuId,
          businessId: business.id,
          name: menu.name,
          nameKey: menu.nameKey,
          category: menu.category,
          sellingPrice: menu.sellingPrice,
          targetMargin: menu.targetMargin,
          isActive: true,
          createdAt: menuCreatedAt,
        });

        for (const r of menu.recipes) {
          const actualIngId = ingIdMap.get(r.ingredientId);
          if (!actualIngId) {
            throw new Error(`Ingredient mapping not found for ${r.ingredientId}`);
          }
          recipeItemData.push({
            menuId: actualMenuId,
            ingredientId: actualIngId,
            qtyUsableBase: r.qtyUsableBase,
          });
        }
      }
      await tx.menu.createMany({ data: menuData });
      await tx.recipeItem.createMany({ data: recipeItemData });

      // 4d. Seed 30-day historical sales (1.300 portions) WITHOUT stock deduction
      const { sales } = generate30DaySales({
        businessId: business.id,
        cashierId: cashierUserId,
        referenceDate: refDate,
        overheadPerPortion: 1200,
      });

      const salesData = [];
      const saleItemsData = [];

      for (const sale of sales) {
        const saleRecordId = `${businessId}-${sale.id}`;
        salesData.push({
          id: saleRecordId,
          businessId: business.id,
          invoiceNo: sale.invoiceNo,
          idempotencyKey: `${businessId}-${sale.idempotencyKey}`,
          soldAt: sale.soldAt,
          cashierId: cashierUserId,
          paymentMethod: sale.paymentMethod,
          totalAmount: sale.totalAmount,
          totalIngredientCost: sale.totalIngredientCost,
          totalOverhead: sale.totalOverhead,
          status: "COMPLETED" as const,
          createdAt: sale.createdAt,
        });

        for (const it of sale.items) {
          const actualMenuId = menuIdMap.get(it.menuId) ?? it.menuId;
          saleItemsData.push({
            id: `${businessId}-${it.id}`,
            saleId: saleRecordId,
            menuId: actualMenuId,
            menuNameSnapshot: it.menuNameSnapshot,
            qty: it.qty,
            unitPrice: it.unitPrice,
            ingredientCostActual: it.ingredientCostActual,
            overheadAllocated: it.overheadAllocated,
          });
        }
      }

      // Batch insert in chunks of 500 to keep parameter count safely below PG limits
      const CHUNK_SIZE = 500;
      for (let i = 0; i < salesData.length; i += CHUNK_SIZE) {
        await tx.sale.createMany({
          data: salesData.slice(i, i + CHUNK_SIZE),
        });
      }

      for (let i = 0; i < saleItemsData.length; i += CHUNK_SIZE) {
        await tx.saleItem.createMany({
          data: saleItemsData.slice(i, i + CHUNK_SIZE),
        });
      }

      // 4e. Seed opening stock batches AFTER sales (opening balance)
      const batchData = [];
      for (const batch of DEMO_OPENING_BATCHES) {
        const actualIngId = ingIdMap.get(batch.ingredientId);
        if (!actualIngId) continue;

        let expiryDate: Date | null = null;
        if (batch.daysExpiryOffset !== null) {
          expiryDate = new Date(refDate);
          expiryDate.setDate(expiryDate.getDate() + batch.daysExpiryOffset);
        }

        batchData.push({
          id: `${businessId}-${batch.id}`,
          businessId: business.id,
          ingredientId: actualIngId,
          receivedAt: refDate,
          expiryDate,
          purchaseQty: batch.purchaseQty,
          purchaseUnit: batch.purchaseUnit,
          purchaseUnitPrice: batch.purchaseUnitPrice,
          initialQtyBase: batch.initialQtyBase,
          remainingQtyBase: batch.remainingQtyBase,
          costPerBase: batch.costPerBase,
        });
      }
      await tx.stockBatch.createMany({ data: batchData });
    },
    { maxWait: 10000, timeout: 60000 }
  );

  logger.info(
    { businessId },
    "Seed demo deterministik selesai: Bisnis, Overhead, Bahan, Resep, Riwayat 1.300 Porsi, dan Stok Awal siap."
  );
}
