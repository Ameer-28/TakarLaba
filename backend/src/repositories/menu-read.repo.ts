import { prisma } from "../lib/db.js";
import { Decimal } from "decimal.js";

export interface MenuFilter {
  search?: string;
  category?: string;
  isActive?: boolean;
}

export interface MenuListItem {
  id: string;
  businessId: string;
  name: string;
  nameKey: string;
  category: string | null;
  sellingPrice: string;
  targetMargin: string | null;
  isActive: boolean;
  hasRecipe: boolean;
  recipeItemsCount: number;
  saleItemsCount: number;
  recipeItems?: {
    id: string;
    ingredientId: string;
    qtyUsableBase: string;
    ingredient: {
      id: string;
      name: string;
      baseUnit: string;
      yieldPercent: string;
      isActive: boolean;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export class MenuReadRepository {
  async findMany(businessId: string, filter?: MenuFilter): Promise<MenuListItem[]> {
    const whereClause: {
      businessId: string;
      category?: string;
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

    const items = await prisma.menu.findMany({
      where: whereClause,
      orderBy: [{ name: "asc" }],
      include: {
        recipeItems: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                baseUnit: true,
                yieldPercent: true,
                isActive: true,
              },
            },
          },
        },
        _count: {
          select: {
            recipeItems: true,
            saleItems: true,
          },
        },
      },
    });

    return items.map((m) => ({
      id: m.id,
      businessId: m.businessId,
      name: m.name,
      nameKey: m.nameKey,
      category: m.category,
      sellingPrice: new Decimal(m.sellingPrice.toString()).toFixed(2),
      targetMargin: m.targetMargin ? new Decimal(m.targetMargin.toString()).toFixed(2) : null,
      isActive: m.isActive,
      hasRecipe: m._count.recipeItems > 0,
      recipeItemsCount: m._count.recipeItems,
      saleItemsCount: m._count.saleItems,
      recipeItems: m.recipeItems.map((r) => ({
        id: r.id,
        ingredientId: r.ingredientId,
        qtyUsableBase: new Decimal(r.qtyUsableBase.toString()).toFixed(3),
        ingredient: {
          id: r.ingredient.id,
          name: r.ingredient.name,
          baseUnit: r.ingredient.baseUnit,
          yieldPercent: new Decimal(r.ingredient.yieldPercent.toString()).toFixed(2),
          isActive: r.ingredient.isActive,
        },
      })),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));
  }

  async findById(businessId: string, id: string) {
    const item = await prisma.menu.findFirst({
      where: { id, businessId },
      include: {
        recipeItems: {
          include: {
            ingredient: {
              include: {
                units: true,
              },
            },
          },
        },
        priceHistories: {
          orderBy: { changedAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            saleItems: true,
            recipeItems: true,
          },
        },
      },
    });

    if (!item) return null;

    return {
      id: item.id,
      businessId: item.businessId,
      name: item.name,
      nameKey: item.nameKey,
      category: item.category,
      sellingPrice: new Decimal(item.sellingPrice.toString()).toFixed(2),
      targetMargin: item.targetMargin ? new Decimal(item.targetMargin.toString()).toFixed(2) : null,
      isActive: item.isActive,
      hasRecipe: item._count.recipeItems > 0,
      recipeItemsCount: item._count.recipeItems,
      saleItemsCount: item._count.saleItems,
      recipeItems: item.recipeItems.map((r) => ({
        id: r.id,
        ingredientId: r.ingredientId,
        ingredientName: r.ingredient.name,
        baseUnit: r.ingredient.baseUnit,
        qtyUsableBase: new Decimal(r.qtyUsableBase.toString()).toFixed(3),
        yieldPercent: new Decimal(r.ingredient.yieldPercent.toString()).toFixed(2),
        isPerishable: r.ingredient.isPerishable,
        units: r.ingredient.units.map((u) => ({
          name: u.name,
          toBaseFactor: new Decimal(u.toBaseFactor.toString()).toFixed(4),
        })),
      })),
      priceHistories: item.priceHistories.map((h) => ({
        id: h.id,
        oldPrice: new Decimal(h.oldPrice.toString()).toFixed(2),
        newPrice: new Decimal(h.newPrice.toString()).toFixed(2),
        reason: h.reason,
        changedById: h.changedById,
        changedAt: h.changedAt,
        alertId: h.alertId,
      })),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async findByNameKey(businessId: string, nameKey: string) {
    return prisma.menu.findUnique({
      where: {
        businessId_nameKey: {
          businessId,
          nameKey,
        },
      },
    });
  }

  async countSales(businessId: string, id: string): Promise<number> {
    const count = await prisma.saleItem.count({
      where: {
        menuId: id,
        sale: { businessId },
      },
    });
    return count;
  }

  async findActiveMenusUsingIngredient(businessId: string, ingredientId: string) {
    const menus = await prisma.menu.findMany({
      where: {
        businessId,
        isActive: true,
        recipeItems: {
          some: {
            ingredientId,
          },
        },
      },
      include: {
        recipeItems: {
          include: {
            ingredient: {
              include: {
                units: true,
              },
            },
          },
        },
      },
    });

    return menus.map((m) => ({
      id: m.id,
      businessId: m.businessId,
      name: m.name,
      sellingPrice: m.sellingPrice,
      targetMargin: m.targetMargin,
      isActive: m.isActive,
      recipeItems: m.recipeItems.map((r) => ({
        id: r.id,
        ingredientId: r.ingredientId,
        qtyUsableBase: r.qtyUsableBase,
        ingredient: {
          id: r.ingredient.id,
          name: r.ingredient.name,
          baseUnit: r.ingredient.baseUnit,
          yieldPercent: r.ingredient.yieldPercent,
          units: r.ingredient.units,
        },
      })),
    }));
  }

  async findAllActiveMenuIds(businessId: string): Promise<string[]> {
    const menus = await prisma.menu.findMany({
      where: { businessId, isActive: true },
      select: { id: true },
    });
    return menus.map((m) => m.id);
  }

  async findPosMenus(businessId: string) {
    return prisma.menu.findMany({
      where: {
        businessId,
        isActive: true,
        recipeItems: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        category: true,
        sellingPrice: true,
        recipeItems: {
          select: {
            ingredientId: true,
            qtyUsableBase: true,
            ingredient: {
              select: {
                id: true,
                name: true,
                baseUnit: true,
                yieldPercent: true,
              },
            },
          },
        },
      },
      orderBy: [{ name: "asc" }],
    });
  }
}
