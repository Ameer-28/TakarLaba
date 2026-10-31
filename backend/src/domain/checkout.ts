import { Decimal } from "decimal.js";
import crypto from "crypto";
import { todayWIBString } from "../lib/date.js";
import { allocateFefo, type FefoBatch, type BatchAllocation } from "./fefo.js";
import { InsufficientStockError, ValidationError, NotFoundError } from "../lib/errors.js";
import type { DecimalValue } from "../lib/money.js";
import { safeDecimal } from "../lib/money.js";

/**
 * Generate a unique invoice number according to ARCHITECTURE §4:
 * Format: INV-YYYYMMDD-XXXXXX (6 random uppercase alphanumeric chars).
 */
export function generateInvoiceNo(now: Date = new Date()): string {
  const dateStr = todayWIBString(now).replace(/-/g, "");
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `INV-${dateStr}-${randomSuffix}`;
}

export interface RecipeItemWithIngredient {
  qtyUsableBase: DecimalValue;
  ingredient: {
    id: string;
    name: string;
    yieldPercent: DecimalValue;
    isActive: boolean;
  };
}

export interface MenuWithRecipes {
  id: string;
  name: string;
  sellingPrice: DecimalValue;
  isActive: boolean;
  recipeItems: RecipeItemWithIngredient[];
}

export interface PreparedSaleItem {
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

export interface SaleAllocationResult {
  totalAmount: Decimal;
  totalIngredientCost: Decimal;
  totalOverhead: Decimal;
  preparedItems: PreparedSaleItem[];
}

/**
 * Calculates raw quantity needed from usable quantity and yield percent (BR-02).
 * rawQty = usableQty / (yieldPercent / 100) * portions
 */
export function calculateRawQuantity(
  usableQtyBase: DecimalValue,
  yieldPercent: DecimalValue,
  portions: number = 1
): Decimal {
  const yieldFactor = safeDecimal(yieldPercent).dividedBy(100);
  const usable = safeDecimal(usableQtyBase);
  return usable.dividedBy(yieldFactor).times(portions);
}

/**
 * Validates menus in order and aggregates total raw quantity required per ingredient.
 */
export function validateAndAggregateRawNeeds(
  items: { menuId: string; qty: number }[],
  menuMap: Map<string, MenuWithRecipes>
): {
  rawNeedMap: Map<string, Decimal>;
  ingredientNameMap: Map<string, string>;
} {
  const rawNeedMap = new Map<string, Decimal>();
  const ingredientNameMap = new Map<string, string>();

  for (const item of items) {
    const menu = menuMap.get(item.menuId);
    if (!menu) {
      throw new NotFoundError(`Menu dengan ID "${item.menuId}" tidak ditemukan`);
    }
    if (!menu.isActive) {
      throw new ValidationError(`Menu "${menu.name}" sedang nonaktif dan tidak dapat dijual`);
    }
    if (menu.recipeItems.length === 0) {
      throw new ValidationError(
        `Menu "${menu.name}" belum memiliki susunan takaran resep sehingga tidak dapat diproses di kasir`
      );
    }

    for (const recipeItem of menu.recipeItems) {
      const ing = recipeItem.ingredient;
      ingredientNameMap.set(ing.id, ing.name);

      const rawNeededForItem = calculateRawQuantity(
        recipeItem.qtyUsableBase,
        ing.yieldPercent,
        item.qty
      );

      const currentTotal = rawNeedMap.get(ing.id) ?? new Decimal(0);
      rawNeedMap.set(ing.id, currentTotal.plus(rawNeededForItem));
    }
  }

  return { rawNeedMap, ingredientNameMap };
}

/**
 * Allocates FEFO batches for each order item and calculates totals & overhead (BR-04, BR-07).
 */
export function allocateSaleItemsFefo(params: {
  items: { menuId: string; qty: number }[];
  menuMap: Map<string, MenuWithRecipes>;
  batchesMap: Map<string, FefoBatch[]>;
  ingredientNameMap: Map<string, string>;
  overheadPerPortion: DecimalValue;
  referenceDate: Date;
}): SaleAllocationResult {
  const { items, menuMap, batchesMap, ingredientNameMap, overheadPerPortion, referenceDate } =
    params;

  const overheadDec = safeDecimal(overheadPerPortion);
  const preparedItems: PreparedSaleItem[] = [];
  let totalAmount = new Decimal(0);
  let totalIngredientCost = new Decimal(0);
  let totalOverhead = new Decimal(0);

  for (const inputItem of items) {
    const menu = menuMap.get(inputItem.menuId)!;
    const unitPrice = safeDecimal(menu.sellingPrice);
    const lineTotal = unitPrice.times(inputItem.qty);
    totalAmount = totalAmount.plus(lineTotal);

    let itemIngredientCost = new Decimal(0);
    const itemAllocations: { ingredientId: string; allocation: BatchAllocation }[] = [];

    for (const recipeItem of menu.recipeItems) {
      const ingId = recipeItem.ingredient.id;
      const ingName = ingredientNameMap.get(ingId) ?? "Bahan";
      const rawNeeded = calculateRawQuantity(
        recipeItem.qtyUsableBase,
        recipeItem.ingredient.yieldPercent,
        inputItem.qty
      );

      const batches = batchesMap.get(ingId) ?? [];
      const allocationResult = allocateFefo(batches, rawNeeded, {
        referenceDate,
        mutate: true,
        allowPartial: false,
      });

      if (allocationResult.isShortage) {
        throw new InsufficientStockError(`Stok bahan "${ingName}" tidak mencukupi untuk pesanan`, {
          ingredientId: ingId,
          ingredientName: ingName,
          needed: rawNeeded.toFixed(3),
          available: allocationResult.availableQty.toFixed(3),
        });
      }

      itemIngredientCost = itemIngredientCost.plus(allocationResult.totalCost);

      for (const alloc of allocationResult.allocations) {
        itemAllocations.push({
          ingredientId: ingId,
          allocation: alloc,
        });
      }
    }

    const lineOverhead = overheadDec.times(inputItem.qty).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

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

  return {
    totalAmount,
    totalIngredientCost,
    totalOverhead,
    preparedItems,
  };
}
