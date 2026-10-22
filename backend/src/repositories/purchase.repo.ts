import { prisma } from "../lib/db.js";
import { Decimal } from "decimal.js";
import type { MovementType } from "../generated/prisma/enums.js";

export interface PreparedBatchRecord {
  ingredientId: string;
  expiryDate: Date | null;
  purchaseQty: Decimal;
  purchaseUnit: string;
  purchaseUnitPrice: Decimal;
  initialQtyBase: Decimal;
  costPerBase: Decimal;
}

export interface CreatePurchaseTxData {
  businessId: string;
  createdById: string;
  supplierName?: string | null;
  note?: string | null;
  purchasedAt: Date;
  totalAmount: Decimal;
  batches: PreparedBatchRecord[];
}

export interface PurchaseFilter {
  startDate?: Date;
  endDate?: Date;
  supplier?: string;
  skip?: number;
  take?: number;
}

export class PurchaseRepository {
  /**
   * Persists a multi-row purchase atomically along with stock batches and stock movements.
   * If any step fails, the entire transaction is rolled back.
   */
  async createAtomic(data: CreatePurchaseTxData) {
    return prisma.$transaction(async (tx) => {
      // 1. Create Purchase header
      const purchase = await tx.purchase.create({
        data: {
          businessId: data.businessId,
          createdById: data.createdById,
          supplierName: data.supplierName ? data.supplierName.trim() : null,
          note: data.note ? data.note.trim() : null,
          purchasedAt: data.purchasedAt,
          totalAmount: data.totalAmount.toFixed(2),
        },
      });

      const createdBatches = [];

      // 2. Create StockBatch and StockMovement for each line item
      for (const item of data.batches) {
        const batch = await tx.stockBatch.create({
          data: {
            businessId: data.businessId,
            ingredientId: item.ingredientId,
            purchaseId: purchase.id,
            receivedAt: data.purchasedAt,
            expiryDate: item.expiryDate,
            purchaseQty: item.purchaseQty.toFixed(3),
            purchaseUnit: item.purchaseUnit,
            purchaseUnitPrice: item.purchaseUnitPrice.toFixed(2),
            initialQtyBase: item.initialQtyBase.toFixed(3),
            remainingQtyBase: item.initialQtyBase.toFixed(3),
            costPerBase: item.costPerBase.toFixed(6),
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
          },
        });

        await tx.stockMovement.create({
          data: {
            businessId: data.businessId,
            ingredientId: item.ingredientId,
            batchId: batch.id,
            type: "PURCHASE" as MovementType,
            qtyBaseDelta: item.initialQtyBase.toFixed(3),
            costPerBase: item.costPerBase.toFixed(6),
            refType: "PURCHASE",
            refId: purchase.id,
            note: data.note ? data.note.trim() : `Pembelian dari nota ${purchase.id}`,
            createdById: data.createdById,
            createdAt: data.purchasedAt,
          },
        });

        createdBatches.push(batch);
      }

      return {
        ...purchase,
        batches: createdBatches,
      };
    });
  }

  async findMany(businessId: string, filter?: PurchaseFilter) {
    const where: {
      businessId: string;
      purchasedAt?: { gte?: Date; lte?: Date };
      supplierName?: { contains: string; mode: "insensitive" };
    } = { businessId };

    if (filter?.startDate || filter?.endDate) {
      where.purchasedAt = {};
      if (filter.startDate) where.purchasedAt.gte = filter.startDate;
      if (filter.endDate) where.purchasedAt.lte = filter.endDate;
    }

    if (filter?.supplier) {
      where.supplierName = {
        contains: filter.supplier,
        mode: "insensitive",
      };
    }

    const [items, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          batches: {
            include: {
              ingredient: {
                select: {
                  id: true,
                  name: true,
                  baseUnit: true,
                  category: true,
                },
              },
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { purchasedAt: "desc" },
        skip: filter?.skip,
        take: filter?.take,
      }),
      prisma.purchase.count({ where }),
    ]);

    return { items, total };
  }

  async findById(businessId: string, id: string) {
    return prisma.purchase.findFirst({
      where: { id, businessId },
      include: {
        batches: {
          include: {
            ingredient: {
              select: {
                id: true,
                name: true,
                baseUnit: true,
                category: true,
              },
            },
            movements: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

export const purchaseRepository = new PurchaseRepository();
