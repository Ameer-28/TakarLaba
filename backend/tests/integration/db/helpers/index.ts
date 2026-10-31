import { prisma } from "../../../../src/lib/db.js";
import { Decimal } from "decimal.js";
import { BaseUnit, IngredientCategory } from "../../../../src/generated/prisma/enums.js";
import { normalizeNameKey } from "../../../../src/domain/units.js";

export * from "../helper.js";

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
