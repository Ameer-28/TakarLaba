import { Decimal } from "decimal.js";
import { calculateOptionA, calculateOptionB } from "./pricing.js";
import {
  calculateMenuCosting,
  type RecipeItemCostInput,
  type MenuCostingResult,
} from "./costing.js";
import type { DecimalValue } from "../lib/money.js";
import { safeDecimal } from "../lib/money.js";

export interface OptionASnapshot {
  recommendedPrice: string;
  projectedMarginPercent: string;
  projectedMarginKontribusi: string;
  priceIncrease: string;
}

export interface OptionBSnapshot {
  maxAllowableCost: string;
  costSavingNeeded: string;
  currentTakaran: string;
  reducedAmount: string;
  newTakaran: string;
  unit: string;
  reductionPercent: string;
  isFeasible: boolean;
  infeasibleReason?: string;
  projectedHppPenuh: string;
  projectedMarginPercent: string;
}

/**
 * Builds and formats Option A (Price Raised) recommendation snapshot.
 */
export function buildOptionASnapshot(
  hppPenuh: Decimal,
  targetMargin: Decimal,
  currentPrice: Decimal,
  roundingStep: number
): {
  raw: ReturnType<typeof calculateOptionA>;
  formatted: OptionASnapshot;
} {
  const optA = calculateOptionA(hppPenuh, targetMargin, currentPrice, roundingStep);
  return {
    raw: optA,
    formatted: {
      recommendedPrice: optA.recommendedPrice.toFixed(2),
      projectedMarginPercent: optA.projectedMarginPercent.toFixed(2),
      projectedMarginKontribusi: optA.projectedMarginKontribusi.toFixed(2),
      priceIncrease: optA.priceIncrease.toFixed(2),
    },
  };
}

/**
 * Builds and formats Option B (Takaran Reduced) recommendation snapshot.
 */
export function buildOptionBSnapshot(params: {
  sellingPrice: Decimal;
  targetMargin: Decimal;
  hppPenuh: Decimal;
  triggerIngredient: {
    id: string;
    name: string;
    baseUnit: string;
    yieldPercent: DecimalValue;
  };
  currentTakaran: DecimalValue;
  costPerBase: Decimal;
}): {
  raw: ReturnType<typeof calculateOptionB>;
  formatted: OptionBSnapshot;
} {
  const optB = calculateOptionB(params.sellingPrice, params.targetMargin, params.hppPenuh, {
    id: params.triggerIngredient.id,
    name: params.triggerIngredient.name,
    currentTakaran: safeDecimal(params.currentTakaran),
    unit: params.triggerIngredient.baseUnit,
    costPerBase: params.costPerBase,
    yieldPercent: params.triggerIngredient.yieldPercent,
  });

  return {
    raw: optB,
    formatted: {
      maxAllowableCost: optB.maxAllowableCost.toFixed(2),
      costSavingNeeded: optB.costSavingNeeded.toFixed(2),
      currentTakaran: optB.currentTakaran.toFixed(3),
      reducedAmount: optB.reducedAmount.toFixed(3),
      newTakaran: optB.newTakaran.toFixed(3),
      unit: optB.unit,
      reductionPercent: optB.reductionPercent.toFixed(2),
      isFeasible: optB.isFeasible,
      infeasibleReason: optB.infeasibleReason,
      projectedHppPenuh: optB.projectedHppPenuh.toFixed(2),
      projectedMarginPercent: optB.projectedMarginPercent.toFixed(2),
    },
  };
}

/**
 * Evaluates recipe costing with optional cost overrides.
 */
export function evaluateRecipeCosting(params: {
  recipeItems: Array<{
    ingredientId: string;
    qtyUsableBase: DecimalValue;
    yieldPercent?: DecimalValue;
    ingredient?: {
      yieldPercent: DecimalValue;
    };
  }>;
  costMap: Map<string, Decimal>;
  costOverrides?: Map<string, Decimal>;
  overheadPerPortion: Decimal;
  sellingPrice: Decimal;
  targetMarginPercent: Decimal;
}): MenuCostingResult {
  const inputs: RecipeItemCostInput[] = params.recipeItems.map((r) => {
    const cost =
      params.costOverrides?.get(r.ingredientId) ?? params.costMap.get(r.ingredientId) ?? null;
    const yieldPercent = r.yieldPercent ?? r.ingredient?.yieldPercent ?? 100;

    return {
      ingredientId: r.ingredientId,
      qtyUsable: r.qtyUsableBase,
      costPerBase: cost,
      yieldPercent,
    };
  });

  return calculateMenuCosting({
    recipeItems: inputs,
    overheadPerPortion: params.overheadPerPortion,
    sellingPrice: params.sellingPrice,
    targetMarginPercent: params.targetMarginPercent,
  });
}
