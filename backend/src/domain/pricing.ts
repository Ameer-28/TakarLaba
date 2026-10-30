import { Decimal } from "decimal.js";
import { safeDecimal, toMoney, toQuantity, toPercent, type DecimalValue } from "../lib/money.js";
import { calculateEffectiveCost } from "./units.js";

export interface OptionARecommendation {
  recommendedPrice: Decimal;
  targetMarginPercent: Decimal;
  projectedMarginPercent: Decimal;
  projectedMarginKontribusi: Decimal;
  priceIncrease: Decimal;
}

export interface OptionBRecommendation {
  currentPrice: Decimal;
  targetMarginPercent: Decimal;
  maxAllowableCost: Decimal;
  costSavingNeeded: Decimal;
  triggerIngredientId: string;
  triggerIngredientName: string;
  currentTakaran: Decimal;
  reducedAmount: Decimal;
  newTakaran: Decimal;
  unit: string;
  reductionPercent: Decimal;
  isFeasible: boolean;
  infeasibleReason?: string;
  projectedHppPenuh: Decimal;
  projectedMarginPercent: Decimal;
}

export interface TriggerIngredientInput {
  id: string;
  name: string;
  currentTakaran: DecimalValue;
  unit: string;
  costPerBase: DecimalValue;
  yieldPercent: DecimalValue;
}

/**
 * Rounds an amount UP to the nearest step (BR-06: step default Rp500).
 * Formula: ceil( amount / step ) * step
 *
 * Example:
 * roundUpToStep(19680, 500) -> 20000
 * roundUpToStep(19500, 500) -> 19500
 * roundUpToStep(19501, 500) -> 20000
 */
export function roundUpToStep(amount: DecimalValue, step: number = 500): Decimal {
  const decAmount = safeDecimal(amount);
  const decStep = new Decimal(step);

  if (decStep.isZero() || decStep.isNegative()) {
    return toMoney(decAmount.ceil());
  }

  const factor = decAmount.dividedBy(decStep).ceil();
  return toMoney(factor.times(decStep));
}

/**
 * Checks whether an alert should be triggered for a menu based on BR-05:
 * An alert is triggered when full margin (Margin % Penuh) falls below targetMargin.
 */
export function shouldTriggerMarginAlert(
  marginPercent: DecimalValue,
  targetMarginPercent: DecimalValue
): boolean {
  const margin = safeDecimal(marginPercent);
  const target = safeDecimal(targetMarginPercent);
  return margin.lessThan(target);
}

/**
 * Calculates Option A (Price Increase / Naikkan Harga) according to BR-06:
 * Formula: harga = ceil( HPP Penuh / (1 - target) / step ) * step
 *
 * Fixture A Example:
 * HPP Penuh = 9.840
 * Target = 50% (0.50)
 * Step = 500
 * rawPrice = 9.840 / 0.50 = 19.680
 * recommendedPrice = ceil( 19.680 / 500 ) * 500 = 40 * 500 = 20.000
 */
export function calculateOptionA(
  hppPenuh: DecimalValue,
  targetMarginPercent: DecimalValue,
  currentPrice: DecimalValue,
  roundingStep: number = 500
): OptionARecommendation {
  const decHppPenuh = safeDecimal(hppPenuh);
  const decTargetPercent = safeDecimal(targetMarginPercent);
  const decCurrentPrice = safeDecimal(currentPrice);

  const targetFraction = decTargetPercent.dividedBy(100);

  if (targetFraction.greaterThanOrEqualTo(1)) {
    throw new Error("Target margin tidak boleh mencapai atau melebihi 100%");
  }

  if (targetFraction.isNegative()) {
    throw new Error("Target margin tidak boleh bernilai negatif");
  }

  const divisor = new Decimal(1).minus(targetFraction);
  const rawPrice = decHppPenuh.dividedBy(divisor);
  const recommendedPrice = roundUpToStep(rawPrice, roundingStep);

  const projectedMarginKontribusi = toMoney(recommendedPrice.minus(decHppPenuh));
  const projectedMarginPercent = recommendedPrice.isZero()
    ? new Decimal(0)
    : toPercent(projectedMarginKontribusi.dividedBy(recommendedPrice).times(100));

  const priceIncrease = toMoney(recommendedPrice.minus(decCurrentPrice));

  return {
    recommendedPrice,
    targetMarginPercent: decTargetPercent,
    projectedMarginPercent,
    projectedMarginKontribusi,
    priceIncrease,
  };
}

/**
 * Calculates Option B (Portion Reduction / Tahan Harga & Efisiensi Porsi) according to BR-06:
 * Formula:
 * maxCost = harga * (1 - target)
 * penghematan = HPP Penuh - maxCost
 * takaran bahan pemicu dikurangi: ceil(penghematan / biaya per usable unit baru)
 * jika melebihi 50% takaran -> tandai "tidak cukup, pilih opsi A"
 *
 * Fixture A Example:
 * currentPrice = 18.000
 * target = 50%
 * maxCost = 18.000 * 0.50 = 9.000
 * HPP Penuh = 9.840
 * penghematan = 9.840 - 9.000 = 840
 * Susu UHT usable cost = 24 / ml (yield 100%)
 * reducedAmount = ceil(840 / 24) = 35 ml
 * newTakaran = 150 ml - 35 ml = 115 ml!
 * reductionPercent = (35 / 150) * 100 = 23.33% <= 50% -> isFeasible = true
 */
export function calculateOptionB(
  currentPrice: DecimalValue,
  targetMarginPercent: DecimalValue,
  hppPenuh: DecimalValue,
  triggerIngredient: TriggerIngredientInput
): OptionBRecommendation {
  const decCurrentPrice = safeDecimal(currentPrice);
  const decTargetPercent = safeDecimal(targetMarginPercent);
  const decHppPenuh = safeDecimal(hppPenuh);

  const targetFraction = decTargetPercent.dividedBy(100);
  const maxAllowableCost = toMoney(decCurrentPrice.times(new Decimal(1).minus(targetFraction)));
  const costSavingNeeded = toMoney(decHppPenuh.minus(maxAllowableCost));

  const currentTakaran = toQuantity(triggerIngredient.currentTakaran);
  const usableCost = calculateEffectiveCost(
    triggerIngredient.costPerBase,
    triggerIngredient.yieldPercent
  );

  if (costSavingNeeded.lessThanOrEqualTo(0) || currentTakaran.isZero()) {
    return {
      currentPrice: toMoney(decCurrentPrice),
      targetMarginPercent: decTargetPercent,
      maxAllowableCost,
      costSavingNeeded: new Decimal(0),
      triggerIngredientId: triggerIngredient.id,
      triggerIngredientName: triggerIngredient.name,
      currentTakaran,
      reducedAmount: new Decimal(0),
      newTakaran: currentTakaran,
      unit: triggerIngredient.unit,
      reductionPercent: new Decimal(0),
      isFeasible: true,
      projectedHppPenuh: toMoney(decHppPenuh),
      projectedMarginPercent: decCurrentPrice.isZero()
        ? new Decimal(0)
        : toPercent(decCurrentPrice.minus(decHppPenuh).dividedBy(decCurrentPrice).times(100)),
    };
  }

  if (usableCost.isZero()) {
    return {
      currentPrice: toMoney(decCurrentPrice),
      targetMarginPercent: decTargetPercent,
      maxAllowableCost,
      costSavingNeeded,
      triggerIngredientId: triggerIngredient.id,
      triggerIngredientName: triggerIngredient.name,
      currentTakaran,
      reducedAmount: new Decimal(0),
      newTakaran: currentTakaran,
      unit: triggerIngredient.unit,
      reductionPercent: new Decimal(0),
      isFeasible: false,
      infeasibleReason: "Biaya bahan baku pemicu adalah 0 sehingga takaran tidak dapat dihitung",
      projectedHppPenuh: toMoney(decHppPenuh),
      projectedMarginPercent: decCurrentPrice.isZero()
        ? new Decimal(0)
        : toPercent(decCurrentPrice.minus(decHppPenuh).dividedBy(decCurrentPrice).times(100)),
    };
  }

  // ceil(penghematan / biaya per usable unit baru)
  const reducedAmount = toQuantity(costSavingNeeded.dividedBy(usableCost).ceil());
  const newTakaran = toQuantity(Decimal.max(0, currentTakaran.minus(reducedAmount)));
  const reductionPercent = toPercent(reducedAmount.dividedBy(currentTakaran).times(100));

  // Feasibility rule: jika melebihi 50% takaran -> tandai "tidak cukup, pilih opsi A"
  const isFeasible = reductionPercent.lessThanOrEqualTo(50);
  const infeasibleReason = isFeasible
    ? undefined
    : "Pengurangan takaran melebihi 50%, kualitas rasa menu akan berubah drastis. Disarankan memilih Opsi A.";

  const actualSavedCost = toMoney(reducedAmount.times(usableCost));
  const projectedHppPenuh = toMoney(decHppPenuh.minus(actualSavedCost));
  const projectedMarginKontribusi = toMoney(decCurrentPrice.minus(projectedHppPenuh));
  const projectedMarginPercent = decCurrentPrice.isZero()
    ? new Decimal(0)
    : toPercent(projectedMarginKontribusi.dividedBy(decCurrentPrice).times(100));

  return {
    currentPrice: toMoney(decCurrentPrice),
    targetMarginPercent: decTargetPercent,
    maxAllowableCost,
    costSavingNeeded,
    triggerIngredientId: triggerIngredient.id,
    triggerIngredientName: triggerIngredient.name,
    currentTakaran,
    reducedAmount,
    newTakaran,
    unit: triggerIngredient.unit,
    reductionPercent,
    isFeasible,
    infeasibleReason,
    projectedHppPenuh,
    projectedMarginPercent,
  };
}
