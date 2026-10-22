import { prisma } from "../lib/db.js";
import { Decimal } from "decimal.js";
import type { BaseUnit, IngredientCategory } from "../generated/prisma/enums.js";
import type { PurchaseUnitInput } from "../validation/ingredient.schema.js";

export interface CreateIngredientData {
  name: string;
  nameKey: string;
  category: IngredientCategory;
  baseUnit: BaseUnit;
  yieldPercent: number | Decimal;
  isPerishable: boolean;
  minStockBase: number | Decimal;
  purchaseUnits?: PurchaseUnitInput[];
}

export interface UpdateIngredientData {
  name?: string;
  nameKey?: string;
  category?: IngredientCategory;
  baseUnit?: BaseUnit;
  yieldPercent?: number | Decimal;
  isPerishable?: boolean;
  minStockBase?: number | Decimal;
  isActive?: boolean;
}

export interface IngredientFilter {
  search?: string;
  category?: IngredientCategory;
  isActive?: boolean;
}

export class IngredientRepository {
  async findMany(businessId: string, filter?: IngredientFilter) {
    const whereClause: {
      businessId: string;
      category?: IngredientCategory;
      isActive?: boolean;
      OR?: {
        name?: { contains: string; mode: "insensitive" };
      }[];
    } = {
      businessId,
    };

    if (filter?.category) {
      whereClause.category = filter.category;
    }

    if (filter?.isActive !== undefined) {
      whereClause.isActive = filter.isActive;
    }

    if (filter?.search) {
      whereClause.OR = [
        {
          name: {
            contains: filter.search,
            mode: "insensitive",
          },
        },
      ];
    }

    return prisma.ingredient.findMany({
      where: whereClause,
      include: {
        units: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async findById(businessId: string, id: string) {
    return prisma.ingredient.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        units: {
          orderBy: { name: "asc" },
        },
      },
    });
  }

  async findByNameKey(businessId: string, nameKey: string) {
    return prisma.ingredient.findUnique({
      where: {
        businessId_nameKey: {
          businessId,
          nameKey,
        },
      },
      include: {
        units: true,
      },
    });
  }

  async create(businessId: string, data: CreateIngredientData) {
    return prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.create({
        data: {
          businessId,
          name: data.name,
          nameKey: data.nameKey,
          category: data.category,
          baseUnit: data.baseUnit,
          yieldPercent: new Decimal(data.yieldPercent).toFixed(2),
          isPerishable: data.isPerishable,
          minStockBase: new Decimal(data.minStockBase).toFixed(3),
          isActive: true,
        },
      });

      if (data.purchaseUnits && data.purchaseUnits.length > 0) {
        await tx.ingredientUnit.createMany({
          data: data.purchaseUnits.map((u) => ({
            ingredientId: ingredient.id,
            name: u.name,
            toBaseFactor: new Decimal(u.toBaseFactor).toFixed(4),
          })),
        });
      }

      return tx.ingredient.findUniqueOrThrow({
        where: { id: ingredient.id },
        include: {
          units: {
            orderBy: { name: "asc" },
          },
        },
      });
    });
  }

  async update(businessId: string, id: string, data: UpdateIngredientData) {
    const updatePayload: {
      name?: string;
      nameKey?: string;
      category?: IngredientCategory;
      baseUnit?: BaseUnit;
      yieldPercent?: string;
      isPerishable?: boolean;
      minStockBase?: string;
      isActive?: boolean;
    } = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.nameKey !== undefined) updatePayload.nameKey = data.nameKey;
    if (data.category !== undefined) updatePayload.category = data.category;
    if (data.baseUnit !== undefined) updatePayload.baseUnit = data.baseUnit;
    if (data.yieldPercent !== undefined) {
      updatePayload.yieldPercent = new Decimal(data.yieldPercent).toFixed(2);
    }
    if (data.isPerishable !== undefined) updatePayload.isPerishable = data.isPerishable;
    if (data.minStockBase !== undefined) {
      updatePayload.minStockBase = new Decimal(data.minStockBase).toFixed(3);
    }
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    return prisma.ingredient.update({
      where: { id, businessId },
      data: updatePayload,
      include: {
        units: {
          orderBy: { name: "asc" },
        },
      },
    });
  }

  async findActiveMenusUsingIngredient(
    businessId: string,
    ingredientId: string
  ): Promise<string[]> {
    const items = await prisma.recipeItem.findMany({
      where: {
        ingredientId,
        menu: {
          businessId,
          isActive: true,
        },
      },
      include: {
        menu: {
          select: { name: true },
        },
      },
    });

    return items.map((i) => i.menu.name);
  }

  async isUsedInBatchesOrRecipes(businessId: string, id: string): Promise<boolean> {
    const [batchCount, recipeCount] = await Promise.all([
      prisma.stockBatch.count({
        where: { businessId, ingredientId: id },
      }),
      prisma.recipeItem.count({
        where: { ingredientId: id },
      }),
    ]);

    return batchCount > 0 || recipeCount > 0;
  }

  async addUnit(ingredientId: string, name: string, toBaseFactor: number | Decimal) {
    return prisma.ingredientUnit.create({
      data: {
        ingredientId,
        name,
        toBaseFactor: new Decimal(toBaseFactor).toFixed(4),
      },
    });
  }

  async deleteUnit(ingredientId: string, unitId: string) {
    return prisma.ingredientUnit.delete({
      where: {
        id: unitId,
        ingredientId,
      },
    });
  }
}

export const ingredientRepository = new IngredientRepository();
