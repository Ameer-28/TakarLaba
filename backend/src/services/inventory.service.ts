import { Decimal } from "decimal.js";
import { inventoryRepository, type BatchFilter } from "../repositories/inventory.repo.js";
import { isExpired, isExpiringSoon } from "../lib/date.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";
import { formatMoney } from "../lib/money.js";
import type { Role } from "../types/express.js";
import type { RecordWasteInput, RecordAdjustmentInput } from "../validation/inventory.schema.js";

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

export interface WasteRecordResponseDto {
  movementId: string;
  batchId: string;
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  qtyBase: string;
  remainingQtyBase: string;
  costPerBase: string;
  wastedValue: string;
  reason: string;
  createdAt: Date;
}

export interface WasteHistoryItemDto {
  id: string;
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  batchId: string | null;
  qtyBase: string;
  costPerBase: string;
  wastedValue: string;
  reason: string;
  createdAt: Date;
  createdByName?: string | null;
  expiryDate?: Date | null;
}

export interface AdjustmentRecordResponseDto {
  movementId: string;
  batchId: string;
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  previousQtyBase: string;
  actualQtyBase: string;
  deltaQtyBase: string;
  diffValue: string;
  reason: string;
  createdAt: Date;
}

export interface AdjustmentHistoryItemDto {
  id: string;
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  batchId: string | null;
  deltaQtyBase: string;
  costPerBase: string;
  diffValue: string;
  reason: string;
  createdAt: Date;
  createdByName?: string | null;
  expiryDate?: Date | null;
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

  /**
   * Records a waste stock movement for a specific batch (FR-INV-03).
   * Verifies remaining stock, performs unit conversion if needed,
   * decrements batch stock atomik, and calculates wasted value.
   */
  async recordWaste(
    businessId: string,
    userId: string,
    input: RecordWasteInput
  ): Promise<WasteRecordResponseDto> {
    const batch = await this.repo.findBatchById(businessId, input.batchId);
    if (!batch) {
      throw new NotFoundError("Batch bahan baku tidak ditemukan");
    }

    const inputQty = new Decimal(input.qty.toString());
    let qtyBase = inputQty;

    // Unit conversion
    if (input.unit && input.unit.trim().toLowerCase() !== batch.ingredient.baseUnit.toLowerCase()) {
      const matchUnit = batch.ingredient.units.find(
        (u) => u.name.toLowerCase() === input.unit!.trim().toLowerCase()
      );
      if (!matchUnit) {
        throw new ValidationError(
          `Satuan "${input.unit}" tidak terdaftar untuk bahan "${batch.ingredient.name}"`
        );
      }
      qtyBase = inputQty.times(new Decimal(matchUnit.toBaseFactor.toString()));
    }

    const wasteDate = input.wasteDate ? new Date(input.wasteDate) : undefined;

    const result = await this.repo.recordWasteAtomic({
      businessId,
      userId,
      batchId: input.batchId,
      qtyBase,
      reason: input.reason,
      wasteDate,
    });

    return {
      movementId: result.movement.id,
      batchId: result.batch.id,
      ingredientId: result.ingredient.id,
      ingredientName: result.ingredient.name,
      baseUnit: result.ingredient.baseUnit,
      qtyBase: result.qtyBase.toFixed(3),
      remainingQtyBase: new Decimal(result.batch.remainingQtyBase.toString()).toFixed(3),
      costPerBase: new Decimal(result.batch.costPerBase.toString()).toFixed(6),
      wastedValue: formatMoney(result.wastedValue),
      reason: result.movement.note ?? input.reason.trim(),
      createdAt: result.movement.createdAt,
    };
  }

  /**
   * Retrieves waste stock movements and history for a business.
   */
  async getWasteHistory(
    businessId: string,
    filter?: { skip?: number; take?: number }
  ): Promise<WasteHistoryItemDto[]> {
    const movements = await this.repo.findWasteMovements(businessId, filter);

    return movements.map((mov) => {
      const qty = new Decimal(mov.qtyBaseDelta.toString()).abs();
      const cost = new Decimal(mov.costPerBase.toString());
      const wastedValue = qty.times(cost);

      return {
        id: mov.id,
        ingredientId: mov.ingredientId,
        ingredientName: mov.ingredient.name,
        baseUnit: mov.ingredient.baseUnit,
        batchId: mov.batchId,
        qtyBase: qty.toFixed(3),
        costPerBase: cost.toFixed(6),
        wastedValue: formatMoney(wastedValue),
        reason: mov.note ?? "",
        createdAt: mov.createdAt,
        createdByName: mov.createdBy?.name,
        expiryDate: mov.batch?.expiryDate,
      };
    });
  }

  /**
   * Records a stock opname adjustment for a specific batch, updates the batch remainingQtyBase,
   * and logs a StockMovement(ADJUSTMENT).
   */
  async recordAdjustment(
    businessId: string,
    userId: string,
    input: RecordAdjustmentInput
  ): Promise<AdjustmentRecordResponseDto> {
    const batch = await this.repo.findBatchById(businessId, input.batchId);
    if (!batch) {
      throw new NotFoundError("Batch bahan baku tidak ditemukan");
    }

    const inputQty = new Decimal(input.actualQty.toString());
    let actualQtyBase = inputQty;

    // Unit conversion if specified
    if (input.unit && input.unit.trim().toLowerCase() !== batch.ingredient.baseUnit.toLowerCase()) {
      const matchUnit = batch.ingredient.units.find(
        (u) => u.name.toLowerCase() === input.unit!.trim().toLowerCase()
      );
      if (!matchUnit) {
        throw new ValidationError(
          `Satuan "${input.unit}" tidak terdaftar untuk bahan "${batch.ingredient.name}"`
        );
      }
      actualQtyBase = inputQty.times(new Decimal(matchUnit.toBaseFactor.toString()));
    }

    const adjustmentDate = input.adjustmentDate ? new Date(input.adjustmentDate) : undefined;

    const result = await this.repo.recordAdjustmentAtomic({
      businessId,
      userId,
      batchId: input.batchId,
      actualQtyBase,
      reason: input.reason,
      adjustmentDate,
    });

    return {
      movementId: result.movement.id,
      batchId: result.batch.id,
      ingredientId: result.ingredient.id,
      ingredientName: result.ingredient.name,
      baseUnit: result.ingredient.baseUnit,
      previousQtyBase: result.previousQtyBase.toFixed(3),
      actualQtyBase: result.actualQtyBase.toFixed(3),
      deltaQtyBase: result.deltaQtyBase.toFixed(3),
      diffValue: formatMoney(result.diffValue),
      reason: result.movement.note ?? input.reason.trim(),
      createdAt: result.movement.createdAt,
    };
  }

  /**
   * Retrieves adjustment stock movements and history for a business.
   */
  async getAdjustmentHistory(
    businessId: string,
    filter?: { skip?: number; take?: number }
  ): Promise<AdjustmentHistoryItemDto[]> {
    const movements = await this.repo.findAdjustmentMovements(businessId, filter);

    return movements.map((mov) => {
      const delta = new Decimal(mov.qtyBaseDelta.toString());
      const cost = new Decimal(mov.costPerBase.toString());
      const diffValue = delta.times(cost);

      return {
        id: mov.id,
        ingredientId: mov.ingredientId,
        ingredientName: mov.ingredient.name,
        baseUnit: mov.ingredient.baseUnit,
        batchId: mov.batchId,
        deltaQtyBase: delta.toFixed(3),
        costPerBase: cost.toFixed(6),
        diffValue: formatMoney(diffValue),
        reason: mov.note ?? "",
        createdAt: mov.createdAt,
        createdByName: mov.createdBy?.name,
        expiryDate: mov.batch?.expiryDate,
      };
    });
  }
}

export const inventoryService = new InventoryService();
