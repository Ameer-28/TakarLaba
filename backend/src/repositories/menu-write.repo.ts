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
  alertId?: string | null;
}

export class MenuWriteRepository {
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
    _businessId: string,
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
            alertId: priceHistory.alertId ?? null,
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

  async saveRecipe(
    _businessId: string,
    menuId: string,
    items: Array<{ ingredientId: string; qtyUsableBase: Decimal | string | number }>
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.recipeItem.deleteMany({
        where: { menuId },
      });

      if (items.length > 0) {
        await tx.recipeItem.createMany({
          data: items.map((item) => ({
            menuId,
            ingredientId: item.ingredientId,
            qtyUsableBase: new Decimal(item.qtyUsableBase).toFixed(3),
          })),
        });
      }
    });
  }
}
