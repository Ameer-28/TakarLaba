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

export function getDemoPassword(): string {
  const password = process.env.DEMO_PASSWORD;
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
  const password = getDemoPassword();
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

  await prisma.$transaction(async (tx) => {
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
  });

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
  const password = options.customPassword ?? getDemoPassword();
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

  // 4. Seed overheads, ingredients, units, menus, recipes inside transaction
  await prisma.$transaction(async (tx) => {
    // 4a. Overhead costs
    for (const ovh of DEMO_OVERHEAD_COSTS) {
      await tx.overheadCost.create({
        data: {
          id: `${businessId}-${ovh.id}`,
          businessId: business.id,
          name: ovh.name,
          type: ovh.type,
          monthlyAmount: ovh.monthlyAmount,
          isActive: ovh.isActive,
        },
      });
    }

    // 4b. Ingredients & units
    const ingIdMap = new Map<string, string>();
    for (const ing of DEMO_INGREDIENTS) {
      const actualIngId = `${businessId}-${ing.id}`;
      ingIdMap.set(ing.id, actualIngId);

      await tx.ingredient.create({
        data: {
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
        },
      });

      for (const u of ing.units) {
        await tx.ingredientUnit.create({
          data: {
            ingredientId: actualIngId,
            name: u.name,
            toBaseFactor: u.toBaseFactor,
          },
        });
      }
    }

    // 4c. Menus & recipes
    const menuIdMap = new Map<string, string>();
    for (const menu of DEMO_MENUS) {
      const actualMenuId = `${businessId}-${menu.id}`;
      menuIdMap.set(menu.id, actualMenuId);

      await tx.menu.create({
        data: {
          id: actualMenuId,
          businessId: business.id,
          name: menu.name,
          nameKey: menu.nameKey,
          category: menu.category,
          sellingPrice: menu.sellingPrice,
          targetMargin: menu.targetMargin,
          isActive: true,
        },
      });

      for (const r of menu.recipes) {
        const actualIngId = ingIdMap.get(r.ingredientId);
        if (!actualIngId) {
          throw new Error(`Ingredient mapping not found for ${r.ingredientId}`);
        }
        await tx.recipeItem.create({
          data: {
            menuId: actualMenuId,
            ingredientId: actualIngId,
            qtyUsableBase: r.qtyUsableBase,
          },
        });
      }
    }

    // 4d. Seed 30-day historical sales (1.300 portions) WITHOUT stock deduction
    const { sales } = generate30DaySales({
      businessId: business.id,
      cashierId: cashierUserId,
      referenceDate: refDate,
      overheadPerPortion: 1200,
    });

    for (const sale of sales) {
      const saleRecordId = `${businessId}-${sale.id}`;
      await tx.sale.create({
        data: {
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
          status: "COMPLETED",
          createdAt: sale.createdAt,
          items: {
            create: sale.items.map((it) => {
              const actualMenuId = menuIdMap.get(it.menuId) ?? it.menuId;
              return {
                id: `${businessId}-${it.id}`,
                menuId: actualMenuId,
                menuNameSnapshot: it.menuNameSnapshot,
                qty: it.qty,
                unitPrice: it.unitPrice,
                ingredientCostActual: it.ingredientCostActual,
                overheadAllocated: it.overheadAllocated,
              };
            }),
          },
        },
      });
    }

    // 4e. Seed opening stock batches AFTER sales (opening balance)
    for (const batch of DEMO_OPENING_BATCHES) {
      const actualIngId = ingIdMap.get(batch.ingredientId);
      if (!actualIngId) continue;

      let expiryDate: Date | null = null;
      if (batch.daysExpiryOffset !== null) {
        expiryDate = new Date(refDate);
        expiryDate.setDate(expiryDate.getDate() + batch.daysExpiryOffset);
      }

      await tx.stockBatch.create({
        data: {
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
        },
      });
    }
  });

  logger.info(
    { businessId },
    "Seed demo deterministik selesai: Bisnis, Overhead, Bahan, Resep, Riwayat 1.300 Porsi, dan Stok Awal siap."
  );
}
