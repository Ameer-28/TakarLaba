import { describe } from "vitest";
import { Decimal } from "decimal.js";
import { prisma, pool } from "../../../src/lib/db.js";
import { BaseUnit, IngredientCategory } from "../../../src/generated/prisma/enums.js";
import { normalizeNameKey } from "../../../src/domain/units.js";

export const hasTestDb = Boolean(process.env.TEST_DATABASE_URL);
export const isCI = Boolean(process.env.CI);

if (isCI && !hasTestDb) {
  throw new Error(
    "TEST_DATABASE_URL must be configured when running real database integration tests in CI"
  );
}

/**
 * Test suite wrapper that skips gracefully in local development when TEST_DATABASE_URL
 * is not configured, but runs in CI where TEST_DATABASE_URL is provided.
 */
export const describeDb = describe.skipIf(!hasTestDb);

/**
 * Creates an isolated test business.
 */
export async function createTestBusiness(prefix = "test") {
  const uniqueId = `biz-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return prisma.business.create({
    data: {
      id: uniqueId,
      name: `Test Business ${prefix}`,
    },
  });
}

/**
 * Creates an isolated test user within a business.
 */
export async function createTestUser(businessId: string, role = "OWNER") {
  const uniqueId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const email = `${uniqueId}@example.test`;
  return prisma.user.create({
    data: {
      id: uniqueId,
      name: `User ${uniqueId}`,
      email,
      role,
      businessId,
    },
  });
}

export interface CreateIngredientParams {
  businessId: string;
  name?: string;
  category?: IngredientCategory;
  baseUnit?: BaseUnit;
  yieldPercent?: number | string | Decimal;
  minStockBase?: number | string | Decimal;
}

export async function createTestIngredient(params: CreateIngredientParams) {
  const name = params.name ?? `Bahan ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const nameKey = normalizeNameKey(name);
  return prisma.ingredient.create({
    data: {
      businessId: params.businessId,
      name,
      nameKey,
      category: params.category ?? IngredientCategory.MAIN,
      baseUnit: params.baseUnit ?? BaseUnit.G,
      yieldPercent: new Decimal(params.yieldPercent?.toString() ?? "100.00").toFixed(2),
      minStockBase: new Decimal(params.minStockBase?.toString() ?? "0").toFixed(3),
    },
  });
}

export interface CreateBatchParams {
  businessId: string;
  ingredientId: string;
  purchaseQty?: number | string | Decimal;
  purchaseUnit?: string;
  purchaseUnitPrice?: number | string | Decimal;
  initialQtyBase?: number | string | Decimal;
  remainingQtyBase: number | string | Decimal;
  costPerBase: number | string | Decimal;
  expiryDate?: Date | null;
  receivedAt?: Date;
  purchaseId?: string | null;
}

export async function createTestBatch(params: CreateBatchParams) {
  const remaining = new Decimal(params.remainingQtyBase.toString()).toFixed(3);
  return prisma.stockBatch.create({
    data: {
      businessId: params.businessId,
      ingredientId: params.ingredientId,
      purchaseId: params.purchaseId ?? null,
      receivedAt: params.receivedAt ?? new Date(),
      expiryDate: params.expiryDate ?? null,
      purchaseQty: new Decimal(params.purchaseQty?.toString() ?? remaining).toFixed(3),
      purchaseUnit: params.purchaseUnit ?? "g",
      purchaseUnitPrice: new Decimal(params.purchaseUnitPrice?.toString() ?? "1000.00").toFixed(2),
      initialQtyBase: new Decimal(params.initialQtyBase?.toString() ?? remaining).toFixed(3),
      remainingQtyBase: remaining,
      costPerBase: new Decimal(params.costPerBase.toString()).toFixed(6),
    },
  });
}

export interface CreateRecipeItemParam {
  ingredientId: string;
  qtyUsableBase: number | string | Decimal;
}

export interface CreateMenuParams {
  businessId: string;
  name?: string;
  sellingPrice: number | string | Decimal;
  targetMargin?: number | string | Decimal;
  isActive?: boolean;
  recipeItems?: CreateRecipeItemParam[];
}

export async function createTestMenuWithRecipe(params: CreateMenuParams) {
  const name = params.name ?? `Menu ${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const nameKey = normalizeNameKey(name);
  return prisma.menu.create({
    data: {
      businessId: params.businessId,
      name,
      nameKey,
      sellingPrice: new Decimal(params.sellingPrice.toString()).toFixed(2),
      targetMargin: params.targetMargin
        ? new Decimal(params.targetMargin.toString()).toFixed(2)
        : null,
      isActive: params.isActive ?? true,
      recipeItems: params.recipeItems
        ? {
            create: params.recipeItems.map((r) => ({
              ingredientId: r.ingredientId,
              qtyUsableBase: new Decimal(r.qtyUsableBase.toString()).toFixed(3),
            })),
          }
        : undefined,
    },
    include: {
      recipeItems: {
        include: {
          ingredient: true,
        },
      },
    },
  });
}

export async function createTestSession(user: { id: string }) {
  const token = `tok-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  const sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await prisma.session.create({
    data: {
      id: sessionId,
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 86400000), // 24 hours
    },
  });
  return {
    token,
    sessionId,
    cookieHeader: `better-auth.session_token=${token}`,
  };
}

/**
 * Cleans up created test businesses and all associated records in proper FK dependency order.
 */
export async function cleanupBusinesses(businessIds: string[]) {
  if (!hasTestDb || businessIds.length === 0) return;

  await prisma.$transaction(async (tx) => {
    // 1. SaleItem (via saleId)
    await tx.saleItem.deleteMany({
      where: { sale: { businessId: { in: businessIds } } },
    });

    // 2. Sale
    await tx.sale.deleteMany({
      where: { businessId: { in: businessIds } },
    });

    // 3. StockMovement
    await tx.stockMovement.deleteMany({
      where: { businessId: { in: businessIds } },
    });

    // 4. MarginAlert
    await tx.marginAlert.deleteMany({
      where: { businessId: { in: businessIds } },
    });

    // 5. MenuPriceHistory (via menuId)
    await tx.menuPriceHistory.deleteMany({
      where: { menu: { businessId: { in: businessIds } } },
    });

    // 6. RecipeItem (via menuId)
    await tx.recipeItem.deleteMany({
      where: { menu: { businessId: { in: businessIds } } },
    });

    // 7. Menu
    await tx.menu.deleteMany({
      where: { businessId: { in: businessIds } },
    });

    // 8. OverheadCost
    await tx.overheadCost.deleteMany({
      where: { businessId: { in: businessIds } },
    });

    // 9. StockBatch
    await tx.stockBatch.deleteMany({
      where: { businessId: { in: businessIds } },
    });

    // 10. Purchase
    await tx.purchase.deleteMany({
      where: { businessId: { in: businessIds } },
    });

    // 11. IngredientUnit (via ingredientId)
    await tx.ingredientUnit.deleteMany({
      where: { ingredient: { businessId: { in: businessIds } } },
    });

    // 12. Ingredient
    await tx.ingredient.deleteMany({
      where: { businessId: { in: businessIds } },
    });

    // 13. Better Auth user tables (session, account, user)
    await tx.session.deleteMany({
      where: { user: { businessId: { in: businessIds } } },
    });

    await tx.account.deleteMany({
      where: { user: { businessId: { in: businessIds } } },
    });

    await tx.user.deleteMany({
      where: { businessId: { in: businessIds } },
    });

    // 14. Business
    await tx.business.deleteMany({
      where: { id: { in: businessIds } },
    });
  });
}

/**
 * Disconnects Prisma client and ends pg pool cleanly after tests finish.
 */
export async function disconnectDb() {
  if (hasTestDb) {
    await prisma.$disconnect();
    await pool.end();
  }
}
