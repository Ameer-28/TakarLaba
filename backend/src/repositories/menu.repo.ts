import { prisma } from "../lib/db.js";
import { Decimal } from "decimal.js";
import type { PriceChangeReason } from "../generated/prisma/enums.js";

export interface CreateMenuData {
  name: string;
  nameKey: string;
  category?: string | null;
  sellingPrice: Decimal | string | number;
  targetMargin?: Decimal | string | number | null;
  isActive?: boolean;
}

export interface UpdateMenuData {
  name?: string;
  nameKey?: string;
  category?: string | null;
  sellingPrice?: Decimal | string | number;
  targetMargin?: Decimal | string | number | null;
  isActive?: boolean;
}

export interface PriceHistoryRecordData {
  oldPrice: Decimal | string | number;
  newPrice: Decimal | string | number;
  reason: PriceChangeReason;
  changedById: string;
}

export interface MenuFilter {
  search?: string;
  category?: string;
  isActive?: boolean;
}

export class MenuRepository {
  async findMany(businessId: string, filter?: MenuFilter) {
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
              select: {
                id: true,
                name: true,
                baseUnit: true,
                category: true,
                yieldPercent: true,
                isActive: true,
              },
            },
          },
        },
        priceHistories: {
          orderBy: { changedAt: "desc" },
          take: 10,
          include: {
            changedBy: {
              select: {
                id: true,
                name: true,
                role: true,
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
        menuId: r.menuId,
        ingredientId: r.ingredientId,
        ingredientName: r.ingredient.name,
        baseUnit: r.ingredient.baseUnit,
        category: r.ingredient.category,
        yieldPercent: new Decimal(r.ingredient.yieldPercent.toString()).toFixed(2),
        isIngredientActive: r.ingredient.isActive,
        qtyUsableBase: new Decimal(r.qtyUsableBase.toString()).toFixed(3),
        createdAt: r.createdAt,
      })),
      priceHistories: item.priceHistories.map((h) => ({
        id: h.id,
        oldPrice: new Decimal(h.oldPrice.toString()).toFixed(2),
        newPrice: new Decimal(h.newPrice.toString()).toFixed(2),
        reason: h.reason,
        alertId: h.alertId,
        changedById: h.changedById,
        changedByName: h.changedBy.name,
        changedAt: h.changedAt,
      })),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async findByNameKey(businessId: string, nameKey: string) {
    const item = await prisma.menu.findUnique({
      where: {
        businessId_nameKey: {
          businessId,
          nameKey,
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
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async countSales(businessId: string, id: string): Promise<number> {
    return prisma.saleItem.count({
      where: {
        menuId: id,
        sale: {
          businessId,
        },
      },
    });
  }

  async create(businessId: string, data: CreateMenuData) {
    const created = await prisma.menu.create({
      data: {
        businessId,
        name: data.name,
        nameKey: data.nameKey,
        category: data.category ?? null,
        sellingPrice: new Decimal(data.sellingPrice).toFixed(2),
        targetMargin:
          data.targetMargin !== undefined && data.targetMargin !== null
            ? new Decimal(data.targetMargin).toFixed(2)
            : null,
        isActive: data.isActive ?? true,
      },
    });

    return {
      id: created.id,
      businessId: created.businessId,
      name: created.name,
      nameKey: created.nameKey,
      category: created.category,
      sellingPrice: new Decimal(created.sellingPrice.toString()).toFixed(2),
      targetMargin: created.targetMargin
        ? new Decimal(created.targetMargin.toString()).toFixed(2)
        : null,
      isActive: created.isActive,
      hasRecipe: false,
      recipeItemsCount: 0,
      saleItemsCount: 0,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async update(
    businessId: string,
    id: string,
    data: UpdateMenuData,
    priceHistory?: PriceHistoryRecordData
  ) {
    return prisma.$transaction(async (tx) => {
      const updatePayload: {
        name?: string;
        nameKey?: string;
        category?: string | null;
        sellingPrice?: string;
        targetMargin?: string | null;
        isActive?: boolean;
      } = {};

      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.nameKey !== undefined) updatePayload.nameKey = data.nameKey;
      if (data.category !== undefined) updatePayload.category = data.category;
      if (data.sellingPrice !== undefined) {
        updatePayload.sellingPrice = new Decimal(data.sellingPrice).toFixed(2);
      }
      if (data.targetMargin !== undefined) {
        updatePayload.targetMargin =
          data.targetMargin !== null ? new Decimal(data.targetMargin).toFixed(2) : null;
      }
      if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

      const updated = await tx.menu.update({
        where: { id },
        data: updatePayload,
      });

      if (priceHistory) {
        await tx.menuPriceHistory.create({
          data: {
            menuId: id,
            oldPrice: new Decimal(priceHistory.oldPrice).toFixed(2),
            newPrice: new Decimal(priceHistory.newPrice).toFixed(2),
            reason: priceHistory.reason,
            changedById: priceHistory.changedById,
          },
        });
      }

      const counts = await tx.menu.findUnique({
        where: { id },
        select: {
          _count: {
            select: {
              recipeItems: true,
              saleItems: true,
            },
          },
        },
      });

      return {
        id: updated.id,
        businessId: updated.businessId,
        name: updated.name,
        nameKey: updated.nameKey,
        category: updated.category,
        sellingPrice: new Decimal(updated.sellingPrice.toString()).toFixed(2),
        targetMargin: updated.targetMargin
          ? new Decimal(updated.targetMargin.toString()).toFixed(2)
          : null,
        isActive: updated.isActive,
        hasRecipe: (counts?._count.recipeItems ?? 0) > 0,
        recipeItemsCount: counts?._count.recipeItems ?? 0,
        saleItemsCount: counts?._count.saleItems ?? 0,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    });
  }

  async delete(businessId: string, id: string) {
    await prisma.menu.delete({
      where: { id, businessId },
    });
    return { id };
  }
}

export const menuRepository = new MenuRepository();
