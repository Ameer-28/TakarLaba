import { prisma } from "../lib/db.js";
import { Decimal } from "decimal.js";
import crypto from "crypto";
import { todayWIB, todayWIBString } from "../lib/date.js";
import { allocateFefo, type FefoBatch, type BatchAllocation } from "../domain/fefo.js";
import { InsufficientStockError, NotFoundError, ValidationError } from "../lib/errors.js";
import type { PaymentMethod } from "../generated/prisma/enums.js";

export interface SaleItemInputRow {
  menuId: string;
  qty: number;
}

export interface SaleFilter {
  startDate?: Date;
  endDate?: Date;
  status?: "COMPLETED" | "VOIDED";
  paymentMethod?: PaymentMethod;
  cashierId?: string;
  skip?: number;
  take?: number;
}

export interface CheckoutSaleParams {
  businessId: string;
  cashierId: string;
  idempotencyKey: string;
  paymentMethod: PaymentMethod;
  items: SaleItemInputRow[];
  overheadPerPortion: Decimal;
}

export interface RawBatchRow {
  id: string;
  ingredientId: string;
  remainingQtyBase: Decimal | string | number;
  costPerBase: Decimal | string | number;
  expiryDate: Date | null;
  receivedAt: Date;
}

/**
 * Generate a unique invoice number according to ARCHITECTURE §4:
 * Format: INV-YYYYMMDD-XXXXXX (6 random uppercase alphanumeric chars).
 */
export function generateInvoiceNo(now: Date = new Date()): string {
  const dateStr = todayWIBString(now).replace(/-/g, "");
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `INV-${dateStr}-${randomSuffix}`;
}

export class SaleRepository {
  /**
   * Find a sale by its idempotency key for a specific business.
   */
  async findByIdempotencyKey(businessId: string, idempotencyKey: string) {
    return prisma.sale.findUnique({
      where: {
        businessId_idempotencyKey: {
          businessId,
          idempotencyKey,
        },
      },
      include: {
        items: true,
      },
    });
  }

  /**
   * Find a sale by its ID for a specific business, including cashier info and stock movements.
   */
  async findById(businessId: string, id: string) {
    const sale = await prisma.sale.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        items: true,
        cashier: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!sale) return null;

    const itemIds = sale.items.map((i) => i.id);
    const movements =
      itemIds.length > 0
        ? await prisma.stockMovement.findMany({
            where: {
              businessId,
              refType: "SALE_ITEM",
              refId: { in: itemIds },
            },
            include: {
              ingredient: {
                select: {
                  id: true,
                  name: true,
                  baseUnit: true,
                },
              },
              batch: {
                select: {
                  id: true,
                  expiryDate: true,
                  purchaseUnit: true,
                  purchaseUnitPrice: true,
                  costPerBase: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          })
        : [];

    return {
      ...sale,
      movements,
    };
  }

  /**
   * List sales for a business with optional date, payment method, cashier, and status filters.
   */
  async findMany(businessId: string, filter?: SaleFilter) {
    const where: {
      businessId: string;
      soldAt?: { gte?: Date; lte?: Date };
      status?: "COMPLETED" | "VOIDED";
      paymentMethod?: PaymentMethod;
      cashierId?: string;
    } = { businessId };

    if (filter?.startDate || filter?.endDate) {
      where.soldAt = {};
      if (filter.startDate) where.soldAt.gte = filter.startDate;
      if (filter.endDate) where.soldAt.lte = filter.endDate;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.paymentMethod) {
      where.paymentMethod = filter.paymentMethod;
    }

    if (filter?.cashierId) {
      where.cashierId = filter.cashierId;
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip: filter?.skip,
        take: filter?.take,
        orderBy: { soldAt: "desc" },
        include: {
          cashier: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          items: true,
        },
      }),
      prisma.sale.count({ where }),
    ]);

    return { sales, total };
  }

  /**
   * Perform atomic FEFO checkout within a single database transaction (ARCHITECTURE §5.1, FR-POS-02).
   *
   * Enforces:
   * 1. Idempotency-Key check: Returns existing sale without side-effects if already processed.
   * 2. Active & recipe-ready validation for all purchased menus.
   * 3. Row locking (`SELECT ... FOR UPDATE`) in deterministic alphabetical order to prevent deadlocks.
   * 4. FEFO allocation via pure domain engine (BR-07, BR-02).
   * 5. Atomicity: Throws InsufficientStockError if any ingredient has shortage, aborting transaction.
   * 6. Accurate cost and overhead snapshotting on SaleItem.
   * 7. Stock movement audit records with type SALE and negative delta.
   */
  async checkoutAtomic(params: CheckoutSaleParams) {
    const { businessId, cashierId, idempotencyKey, paymentMethod, items, overheadPerPortion } =
      params;

    return prisma.$transaction(
      async (tx) => {
        // 1. Check idempotency inside transaction
        const existingSale = await tx.sale.findUnique({
          where: {
            businessId_idempotencyKey: {
              businessId,
              idempotencyKey,
            },
          },
          include: {
            items: true,
          },
        });

        if (existingSale) {
          return existingSale;
        }

        // 2. Fetch all menus in the order
        const menuIds = Array.from(new Set(items.map((i) => i.menuId)));
        const menus = await tx.menu.findMany({
          where: {
            businessId,
            id: { in: menuIds },
          },
          include: {
            recipeItems: {
              include: {
                ingredient: {
                  select: {
                    id: true,
                    name: true,
                    yieldPercent: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        });

        const menuMap = new Map(menus.map((m) => [m.id, m]));

        // Validate each menu
        for (const inputItem of items) {
          const menu = menuMap.get(inputItem.menuId);
          if (!menu) {
            throw new NotFoundError(`Menu dengan ID "${inputItem.menuId}" tidak ditemukan`);
          }
          if (!menu.isActive) {
            throw new ValidationError(`Menu "${menu.name}" sedang nonaktif dan tidak dapat dijual`);
          }
          if (menu.recipeItems.length === 0) {
            throw new ValidationError(
              `Menu "${menu.name}" belum memiliki susunan takaran resep sehingga tidak dapat diproses di kasir`
            );
          }
        }

        // 3. Compute total raw quantity needed per ingredient (BR-02)
        const rawNeedMap = new Map<string, Decimal>();
        const ingredientNameMap = new Map<string, string>();

        for (const inputItem of items) {
          const menu = menuMap.get(inputItem.menuId)!;
          for (const recipeItem of menu.recipeItems) {
            const ing = recipeItem.ingredient;
            ingredientNameMap.set(ing.id, ing.name);

            const yieldFactor = new Decimal(ing.yieldPercent.toString()).dividedBy(100);
            const usableQtyPortion = new Decimal(recipeItem.qtyUsableBase.toString());
            // rawQty = recipeQty × 100 / yieldPercent (BR-02)
            const rawPerPortion = usableQtyPortion.dividedBy(yieldFactor);
            const rawNeededForItem = rawPerPortion.times(inputItem.qty);

            const currentTotal = rawNeedMap.get(ing.id) ?? new Decimal(0);
            rawNeedMap.set(ing.id, currentTotal.plus(rawNeededForItem));
          }
        }

        // 4. Deterministic batch row locking (SELECT ... FOR UPDATE)
        // Sort ingredientIds alphabetically to avoid database deadlocks
        const sortedIngredientIds = Array.from(rawNeedMap.keys()).sort();
        const batchesMap = new Map<string, FefoBatch[]>();

        const currentDateWIB = todayWIB();

        for (const ingId of sortedIngredientIds) {
          const rawRows = await tx.$queryRaw<RawBatchRow[]>`
            SELECT id, "ingredientId", "remainingQtyBase", "costPerBase", "expiryDate", "receivedAt"
            FROM "StockBatch"
            WHERE "businessId" = ${businessId}
              AND "ingredientId" = ${ingId}
              AND "remainingQtyBase" > 0
              AND ("expiryDate" IS NULL OR "expiryDate" >= ${currentDateWIB})
            ORDER BY "expiryDate" ASC NULLS LAST, "receivedAt" ASC, id ASC
            FOR UPDATE
          `;

          // Format rows into FefoBatch array
          const fefoBatches: FefoBatch[] = rawRows.map((r) => ({
            id: r.id,
            remainingQtyBase: new Decimal(r.remainingQtyBase.toString()),
            costPerBase: new Decimal(r.costPerBase.toString()),
            expiryDate: r.expiryDate,
            receivedAt: r.receivedAt,
          }));

          batchesMap.set(ingId, fefoBatches);
        }

        // 5. Allocate batches sequentially per order item & compute actual costs
        interface PreparedItem {
          menuId: string;
          menuNameSnapshot: string;
          qty: number;
          unitPrice: Decimal;
          ingredientCostActual: Decimal;
          overheadAllocated: Decimal;
          allocations: {
            ingredientId: string;
            allocation: BatchAllocation;
          }[];
        }

        const preparedItems: PreparedItem[] = [];
        let totalAmount = new Decimal(0);
        let totalIngredientCost = new Decimal(0);
        let totalOverhead = new Decimal(0);

        for (const inputItem of items) {
          const menu = menuMap.get(inputItem.menuId)!;
          const unitPrice = new Decimal(menu.sellingPrice.toString());
          const lineTotal = unitPrice.times(inputItem.qty);
          totalAmount = totalAmount.plus(lineTotal);

          let itemIngredientCost = new Decimal(0);
          const itemAllocations: { ingredientId: string; allocation: BatchAllocation }[] = [];

          for (const recipeItem of menu.recipeItems) {
            const ingId = recipeItem.ingredient.id;
            const ingName = ingredientNameMap.get(ingId) ?? "Bahan";
            const yieldFactor = new Decimal(
              recipeItem.ingredient.yieldPercent.toString()
            ).dividedBy(100);
            const usableQtyPortion = new Decimal(recipeItem.qtyUsableBase.toString());
            const rawNeeded = usableQtyPortion.dividedBy(yieldFactor).times(inputItem.qty);

            const batches = batchesMap.get(ingId) ?? [];

            // Run pure FEFO allocation engine (in-place mutation)
            const allocationResult = allocateFefo(batches, rawNeeded, {
              referenceDate: currentDateWIB,
              mutate: true,
              allowPartial: false,
            });

            if (allocationResult.isShortage) {
              throw new InsufficientStockError(
                `Stok bahan "${ingName}" tidak mencukupi untuk pesanan`,
                {
                  ingredientId: ingId,
                  ingredientName: ingName,
                  needed: rawNeeded.toFixed(3),
                  available: allocationResult.availableQty.toFixed(3),
                }
              );
            }

            itemIngredientCost = itemIngredientCost.plus(allocationResult.totalCost);

            for (const alloc of allocationResult.allocations) {
              itemAllocations.push({
                ingredientId: ingId,
                allocation: alloc,
              });
            }
          }

          // Overhead allocated per portion (BR-04)
          const lineOverhead = overheadPerPortion
            .times(inputItem.qty)
            .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

          totalIngredientCost = totalIngredientCost.plus(itemIngredientCost);
          totalOverhead = totalOverhead.plus(lineOverhead);

          preparedItems.push({
            menuId: menu.id,
            menuNameSnapshot: menu.name,
            qty: inputItem.qty,
            unitPrice,
            ingredientCostActual: itemIngredientCost,
            overheadAllocated: lineOverhead,
            allocations: itemAllocations,
          });
        }

        // 6. Update all modified batches in database
        for (const [, batches] of batchesMap) {
          for (const batch of batches) {
            await tx.stockBatch.update({
              where: { id: batch.id },
              data: {
                remainingQtyBase: new Decimal(batch.remainingQtyBase.toString()).toFixed(3),
              },
            });
          }
        }

        // 7. Insert Sale & SaleItems
        const invoiceNo = generateInvoiceNo();

        const createdSale = await tx.sale.create({
          data: {
            businessId,
            invoiceNo,
            idempotencyKey,
            cashierId,
            paymentMethod,
            totalAmount: totalAmount.toFixed(2),
            totalIngredientCost: totalIngredientCost.toFixed(2),
            totalOverhead: totalOverhead.toFixed(2),
            status: "COMPLETED",
            items: {
              create: preparedItems.map((p) => ({
                menuId: p.menuId,
                menuNameSnapshot: p.menuNameSnapshot,
                qty: p.qty,
                unitPrice: p.unitPrice.toFixed(2),
                ingredientCostActual: p.ingredientCostActual.toFixed(2),
                overheadAllocated: p.overheadAllocated.toFixed(2),
              })),
            },
          },
          include: {
            items: true,
          },
        });

        // 8. Insert StockMovement records for all allocations
        // Match each item allocation to the created saleItem id
        const saleItemMap = new Map<string, string>();
        for (let i = 0; i < createdSale.items.length; i++) {
          const createdItem = createdSale.items[i]!;
          saleItemMap.set(i.toString(), createdItem.id);
        }

        const movementsToInsert: {
          businessId: string;
          ingredientId: string;
          batchId: string;
          type: "SALE";
          qtyBaseDelta: string;
          costPerBase: string;
          refType: string;
          refId: string;
          createdById: string;
        }[] = [];

        for (let idx = 0; idx < preparedItems.length; idx++) {
          const prep = preparedItems[idx]!;
          const saleItemId = saleItemMap.get(idx.toString())!;

          for (const itemAlloc of prep.allocations) {
            movementsToInsert.push({
              businessId,
              ingredientId: itemAlloc.ingredientId,
              batchId: itemAlloc.allocation.batchId,
              type: "SALE",
              qtyBaseDelta: itemAlloc.allocation.allocatedQty.negated().toFixed(3), // negative delta for stock deduction
              costPerBase: itemAlloc.allocation.costPerBase.toFixed(6),
              refType: "SALE_ITEM",
              refId: saleItemId,
              createdById: cashierId,
            });
          }
        }

        if (movementsToInsert.length > 0) {
          await tx.stockMovement.createMany({
            data: movementsToInsert,
          });
        }

        return createdSale;
      },
      {
        timeout: 15000, // 15 seconds transaction timeout for atomic multi-step POS checkout
      }
    );
  }
}

export const saleRepository = new SaleRepository();
