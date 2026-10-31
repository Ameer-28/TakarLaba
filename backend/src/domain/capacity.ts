import { Decimal } from "decimal.js";
import { safeDecimal, toQuantity, type DecimalValue } from "../lib/money.js";
import { calculateRawNeeded } from "./units.js";

export interface RecipeItemCapacityInput {
  ingredientId: string;
  ingredientName?: string;
  baseUnit?: string;
  qtyUsable: DecimalValue;
  yieldPercent: DecimalValue;
}

export interface MenuCapacityInput {
  menuId: string;
  menuName?: string;
  recipeItems: RecipeItemCapacityInput[];
}

export interface IngredientBottleneck {
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  validStockBase: Decimal;
  rawPerPortion: Decimal;
  maxPortions: number;
}

export interface MenuCapacityResult {
  menuId: string;
  menuName?: string;
  capacity: number;
  hasRecipe: boolean;
  bottleneck: IngredientBottleneck | null;
  items: IngredientBottleneck[];
}

/**
 * Pure domain calculation for Menu Capacity & Bottlenecks (BR-08).
 *
 * Formula:
 * rawPerPorsi_i = recipeQtyUsable_i * 100 / yieldPercent_i
 * kapasitas = floor( min_i( stokRawValid_i / rawPerPorsi_i ) )
 * bottleneck = bahan dengan rasio terkecil
 *
 * @param menu Menu with its recipe items
 * @param availableStockMap Map of ingredientId -> valid non-expired stock (DecimalValue)
 */
export function calculateMenuCapacity(
  menu: MenuCapacityInput,
  availableStockMap: Map<string, DecimalValue>
): MenuCapacityResult {
  const { menuId, menuName, recipeItems } = menu;

  if (!recipeItems || recipeItems.length === 0) {
    return {
      menuId,
      menuName,
      capacity: 0,
      hasRecipe: false,
      bottleneck: null,
      items: [],
    };
  }

  const items: IngredientBottleneck[] = [];

  for (const item of recipeItems) {
    const rawPerPortion = calculateRawNeeded(item.qtyUsable, item.yieldPercent);
    const stockRaw = availableStockMap.get(item.ingredientId) ?? 0;
    const validStockBase = toQuantity(safeDecimal(stockRaw));

    let maxPortions = 0;
    if (rawPerPortion.greaterThan(0)) {
      if (validStockBase.greaterThan(0)) {
        maxPortions = validStockBase.dividedBy(rawPerPortion).floor().toNumber();
      } else {
        maxPortions = 0;
      }
    } else {
      maxPortions = Number.MAX_SAFE_INTEGER;
    }

    items.push({
      ingredientId: item.ingredientId,
      ingredientName: item.ingredientName ?? item.ingredientId,
      baseUnit: item.baseUnit ?? "",
      validStockBase,
      rawPerPortion,
      maxPortions,
    });
  }

  if (items.length === 0) {
    return {
      menuId,
      menuName,
      capacity: 0,
      hasRecipe: false,
      bottleneck: null,
      items: [],
    };
  }

  // Find minimum maxPortions
  let minPortions = items[0]!.maxPortions;
  let bottleneckItem = items[0]!;

  for (let i = 1; i < items.length; i++) {
    const it = items[i]!;
    if (it.maxPortions < minPortions) {
      minPortions = it.maxPortions;
      bottleneckItem = it;
    }
  }

  return {
    menuId,
    menuName,
    capacity: Math.max(0, minPortions),
    hasRecipe: true,
    bottleneck: bottleneckItem,
    items,
  };
}
