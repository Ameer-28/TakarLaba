import { prisma } from "../lib/db.js";
import { Decimal } from "decimal.js";
import { NotFoundError, ConflictError } from "../lib/errors.js";

export interface BatchFilter {
  ingredientId?: string;
  hasRemainingOnly?: boolean;
  skip?: number;
  take?: number;
}

export interface RecordWasteParams {
  businessId: string;
  userId: string;
  batchId: string;
  qtyBase: Decimal;
  reason: string;
  wasteDate?: Date;
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

  /**
   * Retrieves a single batch by ID for a business, including ingredient and unit conversions.
   */
  async findBatchById(businessId: string, batchId: string) {
    return prisma.stockBatch.findFirst({
      where: { id: batchId, businessId },
      include: {
        ingredient: {
          include: {
            units: true,
          },
        },
      },
    });
  }

  /**
   * Atomically records a waste stock movement, decrements batch remainingQtyBase,
   * and calculates the wasted financial loss.
   */
  async recordWasteAtomic(params: RecordWasteParams) {
    return prisma.$transaction(async (tx) => {
      const batch = await tx.stockBatch.findFirst({
        where: { id: params.batchId, businessId: params.businessId },
        include: {
          ingredient: true,
        },
      });

      if (!batch) {
        throw new NotFoundError("Batch bahan baku tidak ditemukan");
      }

      const remaining = new Decimal(batch.remainingQtyBase.toString());
      if (remaining.lessThan(params.qtyBase)) {
        throw new ConflictError(
          `Jumlah terbuang (${params.qtyBase.toFixed(3)}) melebihi sisa stok batch (${remaining.toFixed(3)})`
        );
      }

      const costPerBase = new Decimal(batch.costPerBase.toString());
      const wastedValue = params.qtyBase.times(costPerBase);

      const updatedBatch = await tx.stockBatch.update({
        where: { id: batch.id },
        data: {
          remainingQtyBase: {
            decrement: params.qtyBase.toFixed(3),
          },
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          businessId: params.businessId,
          ingredientId: batch.ingredientId,
          batchId: batch.id,
          type: "WASTE",
          qtyBaseDelta: params.qtyBase.negated().toFixed(3),
          costPerBase: costPerBase.toFixed(6),
          refType: "WASTE",
          refId: null,
          note: params.reason.trim(),
          createdById: params.userId,
          createdAt: params.wasteDate ?? new Date(),
        },
      });

      return {
        movement,
        batch: updatedBatch,
        ingredient: batch.ingredient,
        qtyBase: params.qtyBase,
        wastedValue,
      };
    });
  }

  /**
   * Retrieves waste stock movements for a business.
   */
  async findWasteMovements(businessId: string, filter?: { skip?: number; take?: number }) {
    return prisma.stockMovement.findMany({
      where: {
        businessId,
        type: "WASTE",
      },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            baseUnit: true,
            category: true,
          },
        },
        batch: {
          select: {
            id: true,
            purchaseUnit: true,
            purchaseUnitPrice: true,
            expiryDate: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: filter?.skip,
      take: filter?.take,
    });
  }
}

export const inventoryRepository = new InventoryRepository();
