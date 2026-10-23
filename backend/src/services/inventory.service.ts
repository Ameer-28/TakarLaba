import { Decimal } from "decimal.js";
import { inventoryRepository, type BatchFilter } from "../repositories/inventory.repo.js";
import { isExpired, isExpiringSoon } from "../lib/date.js";
import type { Role } from "../types/express.js";

export type StockStatus = "AMAN" | "SEGERA" | "KEDALUWARSA" | "HABIS";

export interface IngredientStockSummary {
  id: string;
  name: string;
  category: string;
  baseUnit: string;
  minStockBase: string;
  validStockBase: string;
  expiredStockBase: string;
  nearestExpiryDate: Date | null;
  status: StockStatus;
  isLowStock: boolean;
  activeBatchCount: number;
  averageCostPerBase?: string | null;
  latestCostPerBase?: string | null;
}

export interface StockBatchItemDto {
  id: string;
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  category: string;
  receivedAt: Date;
  expiryDate: Date | null;
  purchaseQty: string;
  purchaseUnit: string;
  purchaseUnitPrice?: string;
  initialQtyBase: string;
  remainingQtyBase: string;
  costPerBase?: string;
  status: StockStatus;
  supplierName?: string | null;
  purchaseId?: string | null;
}

export class InventoryService {
  constructor(private readonly repo = inventoryRepository) {}

  /**
   * Computes stock summaries for all active ingredients (FR-ING-02).
   * Strips cost fields when caller role is CASHIER (Rule 7).
   */
  async getStockSummary(
    businessId: string,
    role: Role,
    warnDays = 3
  ): Promise<IngredientStockSummary[]> {
    const ingredients = await this.repo.findIngredientsWithBatches(businessId);

    const summaries: IngredientStockSummary[] = [];

    for (const ing of ingredients) {
      let validStock = new Decimal(0);
      let expiredStock = new Decimal(0);
      let totalValidValue = new Decimal(0);
      let nearestExpiry: Date | null = null;
      let hasExpiringSoon = false;
      let latestBatchCost: Decimal | null = null;
      let latestPurchasedAt: Date | null = null;
      let latestCreatedAt: Date | null = null;

      const activeBatches = ing.stockBatches;

      for (const batch of activeBatches) {
        const remaining = new Decimal(batch.remainingQtyBase.toString());
        const cost = new Decimal(batch.costPerBase.toString());

        // BR-03: Replacement cost per ingredient is taken from the batch with the latest purchasedAt
        // (tie-breaker latest createdAt), NOT from FEFO iteration order.
        const batchWithPurchase = batch as typeof batch & {
          purchase?: { purchasedAt: Date; createdAt: Date } | null;
        };
        const purchasedAt =
          batchWithPurchase.purchase?.purchasedAt ?? batch.receivedAt ?? batch.createdAt;
        const createdAt = batchWithPurchase.purchase?.createdAt ?? batch.createdAt;

        const isNewer =
          !latestPurchasedAt ||
          purchasedAt.getTime() > latestPurchasedAt.getTime() ||
          (purchasedAt.getTime() === latestPurchasedAt.getTime() &&
            (!latestCreatedAt || createdAt.getTime() > latestCreatedAt.getTime()));

        if (isNewer) {
          latestBatchCost = cost;
          latestPurchasedAt = purchasedAt;
          latestCreatedAt = createdAt;
        }

        if (isExpired(batch.expiryDate)) {
          expiredStock = expiredStock.plus(remaining);
        } else {
          validStock = validStock.plus(remaining);
          totalValidValue = totalValidValue.plus(remaining.times(cost));

          if (batch.expiryDate) {
            const exp = new Date(batch.expiryDate);
            if (!nearestExpiry || exp < nearestExpiry) {
              nearestExpiry = exp;
            }
            if (isExpiringSoon(batch.expiryDate, warnDays)) {
              hasExpiringSoon = true;
            }
          }
        }
      }

      // Determine status
      let status: StockStatus;
      if (expiredStock.greaterThan(0)) {
        status = "KEDALUWARSA";
      } else if (validStock.isZero()) {
        status = "HABIS";
      } else if (hasExpiringSoon) {
        status = "SEGERA";
      } else {
        status = "AMAN";
      }

      const minStock = new Decimal(ing.minStockBase.toString());
      const isLowStock = validStock.lessThanOrEqualTo(minStock);

      const summary: IngredientStockSummary = {
        id: ing.id,
        name: ing.name,
        category: ing.category,
        baseUnit: ing.baseUnit,
        minStockBase: minStock.toFixed(3),
        validStockBase: validStock.toFixed(3),
        expiredStockBase: expiredStock.toFixed(3),
        nearestExpiryDate: nearestExpiry,
        status,
        isLowStock,
        activeBatchCount: activeBatches.length,
      };

      // Strip cost fields for CASHIER (Rule 7)
      if (role !== "CASHIER") {
        summary.averageCostPerBase = validStock.greaterThan(0)
          ? totalValidValue.dividedBy(validStock).toFixed(6)
          : null;
        summary.latestCostPerBase = latestBatchCost ? latestBatchCost.toFixed(6) : null;
      }

      summaries.push(summary);
    }

    return summaries;
  }

  /**
   * Retrieves stock batches with status and FEFO ordering.
   * Strips cost fields when caller role is CASHIER (Rule 7).
   */
  async getBatches(
    businessId: string,
    role: Role,
    filter?: BatchFilter,
    warnDays = 3
  ): Promise<StockBatchItemDto[]> {
    const batches = await this.repo.findBatches(businessId, filter);

    return batches.map((batch) => {
      const remaining = new Decimal(batch.remainingQtyBase.toString());

      let status: StockStatus;
      if (isExpired(batch.expiryDate)) {
        status = "KEDALUWARSA";
      } else if (remaining.isZero()) {
        status = "HABIS";
      } else if (isExpiringSoon(batch.expiryDate, warnDays)) {
        status = "SEGERA";
      } else {
        status = "AMAN";
      }

      const itemDto: StockBatchItemDto = {
        id: batch.id,
        ingredientId: batch.ingredientId,
        ingredientName: batch.ingredient.name,
        baseUnit: batch.ingredient.baseUnit,
        category: batch.ingredient.category,
        receivedAt: batch.receivedAt,
        expiryDate: batch.expiryDate,
        purchaseQty: new Decimal(batch.purchaseQty.toString()).toFixed(3),
        purchaseUnit: batch.purchaseUnit,
        initialQtyBase: new Decimal(batch.initialQtyBase.toString()).toFixed(3),
        remainingQtyBase: remaining.toFixed(3),
        status,
        supplierName: batch.purchase?.supplierName,
        purchaseId: batch.purchaseId,
      };

      // Strip cost fields for CASHIER (Rule 7)
      if (role !== "CASHIER") {
        itemDto.purchaseUnitPrice = new Decimal(batch.purchaseUnitPrice.toString()).toFixed(2);
        itemDto.costPerBase = new Decimal(batch.costPerBase.toString()).toFixed(6);
      }

      return itemDto;
    });
  }
}

export const inventoryService = new InventoryService();
