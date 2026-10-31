import { Decimal } from "decimal.js";
import {
  safeDecimal,
  toMoney,
  toQuantity,
  toPercent,
  toCostPerBase,
  type DecimalValue,
} from "../lib/money.js";
import { calculateEffectiveCost } from "./units.js";

export type MarginStatus = "AMAN" | "WASPADA" | "BAHAYA" | "INCOMPLETE";

export interface RecipeItemCostInput {
  ingredientId: string;
  qtyUsable: DecimalValue;
  costPerBase: DecimalValue | null;
  yieldPercent: DecimalValue;
}

export interface RecipeItemCostResult {
  ingredientId: string;
  qtyUsable: Decimal;
  costPerBase: Decimal | null;
  yieldPercent: Decimal;
  costPerUsable: Decimal | null;
  subtotal: Decimal | null;
  hasCost: boolean;
}

export interface CalculateMenuCostingParams {
  recipeItems: RecipeItemCostInput[];
  overheadPerPortion: DecimalValue;
  sellingPrice: DecimalValue;
  targetMarginPercent: DecimalValue;
}

export interface MenuCostingResult {
  hppBahan: Decimal | null;
  overheadPerPortion: Decimal;
  hppPenuh: Decimal | null;
  sellingPrice: Decimal;
  marginKontribusi: Decimal | null;
  marginPercent: Decimal | null;
  marginBahanPercent: Decimal | null;
  marginStatus: MarginStatus;
  isCostComplete: boolean;
  items: RecipeItemCostResult[];
}

/**
 * Determine the margin safety status based on BR-09:
 * - AMAN: margin >= target
 * - WASPADA: target - 5 pp <= margin < target
 * - BAHAYA: margin < target - 5 pp
 */
export function calculateMarginStatus(
  marginPercent: DecimalValue,
  targetMarginPercent: DecimalValue
): "AMAN" | "WASPADA" | "BAHAYA" {
  const margin = safeDecimal(marginPercent);
  const target = safeDecimal(targetMarginPercent);
  const warningThreshold = target.minus(5);

  if (margin.greaterThanOrEqualTo(target)) {
    return "AMAN";
  }

  if (margin.greaterThanOrEqualTo(warningThreshold)) {
    return "WASPADA";
  }

  return "BAHAYA";
}

/**
 * Calculate the cost of an individual recipe item line (BR-02).
 * Formatted and quantized using Decimal.js.
 */
export function calculateRecipeItemCost(item: RecipeItemCostInput): RecipeItemCostResult {
  const qty = toQuantity(item.qtyUsable);
  const yieldPct = safeDecimal(item.yieldPercent);

  if (item.costPerBase === null || item.costPerBase === undefined) {
    return {
      ingredientId: item.ingredientId,
      qtyUsable: qty,
      costPerBase: null,
      yieldPercent: yieldPct,
      costPerUsable: null,
      subtotal: null,
      hasCost: false,
    };
  }

  const baseCost = toCostPerBase(item.costPerBase);
  const usableCost = calculateEffectiveCost(baseCost, yieldPct);
  const subtotal = toMoney(qty.times(usableCost));

  return {
    ingredientId: item.ingredientId,
    qtyUsable: qty,
    costPerBase: baseCost,
    yieldPercent: yieldPct,
    costPerUsable: usableCost,
    subtotal,
    hasCost: true,
  };
}

/**
 * Pure domain calculation for Menu Costing (BR-01, BR-02, BR-04, BR-09).
 * Computes:
 * - HPP Bahan = sum(recipeItem.subtotal)
 * - HPP Penuh = HPP Bahan + overheadPerPortion
 * - Margin Kontribusi (Rp) = sellingPrice - HPP Penuh
 * - Margin Penuh (%) = (sellingPrice - HPP Penuh) / sellingPrice * 100
 * - Margin Bahan (%) = (sellingPrice - HPP Bahan) / sellingPrice * 100
 * - Margin Status: AMAN, WASPADA, BAHAYA, or INCOMPLETE
 */
export function calculateMenuCosting({
  recipeItems,
  overheadPerPortion,
  sellingPrice,
  targetMarginPercent,
}: CalculateMenuCostingParams): MenuCostingResult {
  const price = toMoney(sellingPrice);
  const overhead = toMoney(overheadPerPortion);
  const targetMargin = safeDecimal(targetMarginPercent);

  const calculatedItems = recipeItems.map(calculateRecipeItemCost);

  // If there are no recipe items, or any item is missing costPerBase
  const hasIncompleteCost =
    calculatedItems.length === 0 || calculatedItems.some((item) => !item.hasCost);

  if (hasIncompleteCost) {
    return {
      hppBahan: null,
      overheadPerPortion: overhead,
      hppPenuh: null,
      sellingPrice: price,
      marginKontribusi: null,
      marginPercent: null,
      marginBahanPercent: null,
      marginStatus: "INCOMPLETE",
      isCostComplete: false,
      items: calculatedItems,
    };
  }

  // Calculate HPP Bahan
  let totalBahan = new Decimal(0);
  for (const item of calculatedItems) {
    if (item.subtotal) {
      totalBahan = totalBahan.plus(item.subtotal);
    }
  }
  const hppBahan = toMoney(totalBahan);
  const hppPenuh = toMoney(hppBahan.plus(overhead));

  // Margin Kontribusi (Rp)
  const marginKontribusi = toMoney(price.minus(hppPenuh));

  // Margin Percentages
  // Division by zero guard: if sellingPrice <= 0, clamp to 0
  let marginPercent = new Decimal(0);
  let marginBahanPercent = new Decimal(0);

  if (price.greaterThan(0)) {
    marginPercent = toPercent(price.minus(hppPenuh).dividedBy(price).times(100));
    marginBahanPercent = toPercent(price.minus(hppBahan).dividedBy(price).times(100));
  }

  const marginStatus = calculateMarginStatus(marginPercent, targetMargin);

  return {
    hppBahan,
    overheadPerPortion: overhead,
    hppPenuh,
    sellingPrice: price,
    marginKontribusi,
    marginPercent,
    marginBahanPercent,
    marginStatus,
    isCostComplete: true,
    items: calculatedItems,
  };
}
