import { prisma } from "../lib/db.js";
import { Decimal } from "decimal.js";
import { todayWIB } from "../lib/date.js";
import type { FefoBatch } from "../domain/fefo.js";
import {
  generateInvoiceNo,
  validateAndAggregateRawNeeds,
  allocateSaleItemsFefo,
  type SaleAllocationResult,
} from "../domain/checkout.js";
import type { PaymentMethod } from "../generated/prisma/enums.js";

export { generateInvoiceNo } from "../domain/checkout.js";

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

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

export class SaleRepository {
  /**
   * Find a sale by its idempotency key for a specific business.
   */
  async findByIdempotencyKey(
    businessId: string,
    idempotencyKey: string,
    tx: { sale: typeof prisma.sale } = prisma
  ) {
    return tx.sale.findUnique({
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
        cashier: { select: { id: true, name: true, role: true } },
      },
    });

    if (!sale) return null;

    const itemIds = sale.items.map((i) => i.id);
    const movements =
      itemIds.length > 0
        ? await prisma.stockMovement.findMany({
            where: { businessId, refType: "SALE_ITEM", refId: { in: itemIds } },
            include: {
              ingredient: { select: { id: true, name: true, baseUnit: true } },
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

    return { ...sale, movements };
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
    } = {
      businessId,
      ...(filter?.startDate || filter?.endDate
        ? { soldAt: { gte: filter?.startDate, lte: filter?.endDate } }
        : {}),
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.paymentMethod ? { paymentMethod: filter.paymentMethod } : {}),
      ...(filter?.cashierId ? { cashierId: filter.cashierId } : {}),
    };

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip: filter?.skip,
        take: filter?.take,
        orderBy: { soldAt: "desc" },
        include: {
          cashier: { select: { id: true, name: true, role: true } },
          items: true,
        },
      }),
      prisma.sale.count({ where }),
    ]);

    return { sales, total };
  }

  private async fetchMenusWithRecipes(tx: Tx, businessId: string, menuIds: string[]) {
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
    return new Map(menus.map((m) => [m.id, m]));
  }

  private async lockStockBatches(
    tx: Tx,
    businessId: string,
    sortedIngredientIds: string[],
    referenceDate: Date
  ): Promise<Map<string, FefoBatch[]>> {
    const batchesMap = new Map<string, FefoBatch[]>();

    for (const ingId of sortedIngredientIds) {
      const rawRows = await tx.$queryRaw<RawBatchRow[]>`
        SELECT id, "ingredientId", "remainingQtyBase", "costPerBase", "expiryDate", "receivedAt"
        FROM "StockBatch"
        WHERE "businessId" = ${businessId}
          AND "ingredientId" = ${ingId}
          AND "remainingQtyBase" > 0
          AND ("expiryDate" IS NULL OR "expiryDate" >= ${referenceDate})
        ORDER BY "expiryDate" ASC NULLS LAST, "receivedAt" ASC, id ASC
        FOR UPDATE
      `;

      const fefoBatches: FefoBatch[] = rawRows.map((r) => ({
        id: r.id,
        remainingQtyBase: new Decimal(r.remainingQtyBase.toString()),
        costPerBase: new Decimal(r.costPerBase.toString()),
        expiryDate: r.expiryDate,
        receivedAt: r.receivedAt,
      }));

      batchesMap.set(ingId, fefoBatches);
    }

    return batchesMap;
  }

  private async persistSaleTransaction(
    tx: Tx,
    params: {
      businessId: string;
      cashierId: string;
      idempotencyKey: string;
      paymentMethod: PaymentMethod;
      batchesMap: Map<string, FefoBatch[]>;
      allocationResult: SaleAllocationResult;
    }
  ) {
    const { businessId, cashierId, idempotencyKey, paymentMethod, batchesMap, allocationResult } =
      params;

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

    const invoiceNo = generateInvoiceNo();
    const createdSale = await tx.sale.create({
      data: {
        businessId,
        invoiceNo,
        idempotencyKey,
        cashierId,
        paymentMethod,
        totalAmount: allocationResult.totalAmount.toFixed(2),
        totalIngredientCost: allocationResult.totalIngredientCost.toFixed(2),
        totalOverhead: allocationResult.totalOverhead.toFixed(2),
        status: "COMPLETED",
        items: {
          create: allocationResult.preparedItems.map((p) => ({
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

    const movementsToInsert = allocationResult.preparedItems.flatMap((prep, idx) => {
      const saleItemId = createdSale.items[idx]!.id;
      return prep.allocations.map((itemAlloc) => ({
        businessId,
        ingredientId: itemAlloc.ingredientId,
        batchId: itemAlloc.allocation.batchId,
        type: "SALE" as const,
        qtyBaseDelta: itemAlloc.allocation.allocatedQty.negated().toFixed(3),
        costPerBase: itemAlloc.allocation.costPerBase.toFixed(6),
        refType: "SALE_ITEM",
        refId: saleItemId,
        createdById: cashierId,
      }));
    });

    if (movementsToInsert.length > 0) {
      await tx.stockMovement.createMany({
        data: movementsToInsert,
      });
    }

    return createdSale;
  }

  /**
   * Perform atomic FEFO checkout within a single database transaction (ARCHITECTURE §5.1, FR-POS-02).
   */
  async checkoutAtomic(params: CheckoutSaleParams) {
    const { businessId, cashierId, idempotencyKey, paymentMethod, items, overheadPerPortion } =
      params;

    return prisma.$transaction(
      async (tx) => {
        // 1. Check idempotency
        const existingSale = await this.findByIdempotencyKey(businessId, idempotencyKey, tx);
        if (existingSale) {
          return existingSale;
        }

        // 2. Fetch menus with recipes
        const menuIds = Array.from(new Set(items.map((i) => i.menuId)));
        const menuMap = await this.fetchMenusWithRecipes(tx, businessId, menuIds);

        // 3. Validate & aggregate raw material requirements (BR-02)
        const { rawNeedMap, ingredientNameMap } = validateAndAggregateRawNeeds(items, menuMap);

        // 4. Deterministic row locking (SELECT ... FOR UPDATE) in alphabetical order
        const sortedIngredientIds = Array.from(rawNeedMap.keys()).sort();
        const currentDateWIB = todayWIB();
        const batchesMap = await this.lockStockBatches(
          tx,
          businessId,
          sortedIngredientIds,
          currentDateWIB
        );

        // 5. FEFO allocation via pure domain engine (BR-04, BR-07)
        const allocationResult = allocateSaleItemsFefo({
          items,
          menuMap,
          batchesMap,
          ingredientNameMap,
          overheadPerPortion,
          referenceDate: currentDateWIB,
        });

        // 6. Persist batches, sale, sale items, and stock movements
        return this.persistSaleTransaction(tx, {
          businessId,
          cashierId,
          idempotencyKey,
          paymentMethod,
          batchesMap,
          allocationResult,
        });
      },
      {
        timeout: 15000,
      }
    );
  }
}

export const saleRepository = new SaleRepository();
