import { prisma } from "../lib/db.js";

export interface BatchFilter {
  ingredientId?: string;
  hasRemainingOnly?: boolean;
  skip?: number;
  take?: number;
}

export class InventoryRepository {
  /**
   * Retrieves all active ingredients with their inventory batches for a tenant.
   */
  async findIngredientsWithBatches(businessId: string) {
    return prisma.ingredient.findMany({
      where: { businessId, isActive: true },
      include: {
        units: true,
        stockBatches: {
          where: {
            remainingQtyBase: { gt: 0 },
          },
          include: {
            purchase: {
              select: {
                id: true,
                purchasedAt: true,
                createdAt: true,
              },
            },
          },
          orderBy: [
            // FEFO: non-null expiry dates first, ascending
            { expiryDate: { sort: "asc", nulls: "last" } },
            { receivedAt: "asc" },
          ],
        },
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Retrieves stock batches with ingredient metadata.
   */
  async findBatches(businessId: string, filter?: BatchFilter) {
    const where: {
      businessId: string;
      ingredientId?: string;
      remainingQtyBase?: { gt: number };
    } = { businessId };

    if (filter?.ingredientId) {
      where.ingredientId = filter.ingredientId;
    }

    if (filter?.hasRemainingOnly) {
      where.remainingQtyBase = { gt: 0 };
    }

    return prisma.stockBatch.findMany({
      where,
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            baseUnit: true,
            category: true,
            isPerishable: true,
            minStockBase: true,
          },
        },
        purchase: {
          select: {
            id: true,
            supplierName: true,
            purchasedAt: true,
          },
        },
      },
      orderBy: [{ expiryDate: { sort: "asc", nulls: "last" } }, { receivedAt: "asc" }],
      skip: filter?.skip,
      take: filter?.take,
    });
  }
}

export const inventoryRepository = new InventoryRepository();
