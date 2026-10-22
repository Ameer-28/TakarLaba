import { Decimal } from "decimal.js";
import { safeDecimal, toQuantity, toCostPerBase, type DecimalValue } from "../lib/money.js";

/**
 * Normalizes an ingredient name into a consistent lowercase key for unique constraints.
 * Trims extra spaces and converts to lowercase.
 * Example: "  Kopi   Arabika  " -> "kopi arabika"
 */
export function normalizeNameKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Convert a purchased quantity in a custom unit to raw base units.
 * Formula: purchaseQty * toBaseFactor
 * Quantized to 3 decimal places (HALF_UP).
 */
export function toBaseQuantity(purchaseQty: DecimalValue, toBaseFactor: DecimalValue): Decimal {
  const qty = safeDecimal(purchaseQty);
  const factor = safeDecimal(toBaseFactor);

  if (factor.isNegative() || factor.isZero()) {
    throw new Error("Faktor konversi ke satuan dasar harus lebih besar dari 0");
  }

  return toQuantity(qty.times(factor));
}

/**
 * Compute the cost per raw base unit from purchase unit price and conversion factor.
 * Formula: purchaseUnitPrice / toBaseFactor
 * Quantized to 6 decimal places (HALF_UP).
 */
export function computeCostPerBase(
  purchaseUnitPrice: DecimalValue,
  toBaseFactor: DecimalValue
): Decimal {
  const price = safeDecimal(purchaseUnitPrice);
  const factor = safeDecimal(toBaseFactor);

  if (factor.isNegative() || factor.isZero()) {
    throw new Error("Faktor konversi ke satuan dasar harus lebih besar dari 0");
  }

  return toCostPerBase(price.dividedBy(factor));
}

/**
 * Calculate raw ingredient quantity needed from usable recipe quantity and yield percentage (BR-02).
 * Formula: qtyUsableBase * 100 / yieldPercent
 * Example: 70g usable chicken with 70% yield -> 70 * 100 / 70 = 100g raw needed.
 * Quantized to 3 decimal places (HALF_UP).
 */
export function calculateRawNeeded(
  qtyUsableBase: DecimalValue,
  yieldPercent: DecimalValue
): Decimal {
  const usable = safeDecimal(qtyUsableBase);
  const yieldPct = safeDecimal(yieldPercent);

  if (yieldPct.isNegative() || yieldPct.isZero() || yieldPct.greaterThan(100)) {
    throw new Error("Persentase yield harus bernilai antara 1 sampai 100");
  }

  return toQuantity(usable.times(100).dividedBy(yieldPct));
}

/**
 * Calculate effective cost per usable base unit taking yield loss into account.
 * Formula: costPerBase * 100 / yieldPercent
 * Example: costPerBase Rp50/g with 50% yield -> Rp50 * 100 / 50 = Rp100/g usable cost.
 * Quantized to 6 decimal places (HALF_UP).
 */
export function calculateEffectiveCost(
  costPerBase: DecimalValue,
  yieldPercent: DecimalValue
): Decimal {
  const cost = safeDecimal(costPerBase);
  const yieldPct = safeDecimal(yieldPercent);

  if (yieldPct.isNegative() || yieldPct.isZero() || yieldPct.greaterThan(100)) {
    throw new Error("Persentase yield harus bernilai antara 1 sampai 100");
  }

  return toCostPerBase(cost.times(100).dividedBy(yieldPct));
}
