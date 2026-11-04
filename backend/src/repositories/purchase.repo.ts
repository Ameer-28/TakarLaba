import { prisma } from "../lib/db.js";
import { Decimal } from "decimal.js";
import type { MovementType } from "../generated/prisma/enums.js";
import type { Prisma } from "../generated/prisma/client.js";
import { NotFoundError, ConflictError } from "../lib/errors.js";

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

  /**
   * Atomically voids a purchase (FR-PUR-02).
   * Enforces that:
   * 1. The purchase exists and belongs to tenant.
   * 2. The purchase is not already voided (marked via note "[DIBATALKAN]").
   * 3. ALL batches generated by this purchase are completely unused (remainingQtyBase === initialQtyBase).
   * If any batch has remainingQtyBase < initialQtyBase, throws ConflictError.
   * When valid:
   * - Sets remainingQtyBase to 0 for all batches
   * - Creates compensating ADJUSTMENT stock movements
   * - Updates purchase note with [DIBATALKAN: <reason>]
   */
  async voidPurchaseAtomic(businessId: string, userId: string, purchaseId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findFirst({
        where: { id: purchaseId, businessId },
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
      });

      if (!purchase) {
        throw new NotFoundError("Nota pembelian tidak ditemukan");
      }

      if (purchase.note?.startsWith("[DIBATALKAN]")) {
        throw new ConflictError("Nota pembelian ini sudah dibatalkan sebelumnya");
      }

      // Check if all batches are completely unused
      for (const batch of purchase.batches) {
        const remaining = new Decimal(batch.remainingQtyBase.toString());
        const initial = new Decimal(batch.initialQtyBase.toString());

        if (!remaining.equals(initial)) {
          throw new ConflictError(
            `Nota pembelian tidak dapat dibatalkan karena stok bahan "${batch.ingredient.name}" sudah terpakai (tersisa ${remaining.toFixed(3)} dari ${initial.toFixed(3)} ${batch.purchaseUnit}).`
          );
        }
      }

      // Decrement batches remainingQtyBase to 0 and record compensating ADJUSTMENT movements
      const adjustmentMovements: Prisma.StockMovementCreateManyInput[] = [];

      for (const batch of purchase.batches) {
        await tx.stockBatch.update({
          where: { id: batch.id },
          data: {
            remainingQtyBase: "0.000",
          },
        });

        adjustmentMovements.push({
          businessId,
          ingredientId: batch.ingredientId,
          batchId: batch.id,
          type: "ADJUSTMENT" as MovementType,
          qtyBaseDelta: new Decimal(batch.initialQtyBase.toString()).negated().toFixed(3),
          costPerBase: new Decimal(batch.costPerBase.toString()).toFixed(6),
          refType: "PURCHASE_VOID",
          refId: purchase.id,
          note: `Pembatalan nota pembelian: ${reason.trim()}`,
          createdById: userId,
        });
      }

      if (adjustmentMovements.length > 0) {
        await tx.stockMovement.createMany({
          data: adjustmentMovements,
        });
      }

      const updatedNote = `[DIBATALKAN: ${reason.trim()}]${purchase.note ? ` ${purchase.note}` : ""}`;

      const voidedPurchase = await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          note: updatedNote,
        },
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
      });

      return voidedPurchase;
    });
  }
}

export const purchaseRepository = new PurchaseRepository();
