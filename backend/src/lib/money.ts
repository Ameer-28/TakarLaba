import { Decimal } from "decimal.js";

// Configure global Decimal precision and rounding mode to HALF_UP
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -9,
  toExpPos: 28,
});

export type DecimalValue = Decimal | string | number;

/**
 * Convert any valid value into a Decimal instance safely.
 */
export function safeDecimal(val: DecimalValue): Decimal {
  if (val instanceof Decimal) {
    return val;
  }
  if (typeof val === "number" && !Number.isFinite(val)) {
    throw new TypeError("Cannot convert non-finite number to Decimal");
  }
  return new Decimal(val);
}

/**
 * Standardize money amounts to 2 decimal places (HALF_UP rounding).
 */
export function toMoney(val: DecimalValue): Decimal {
  return safeDecimal(val).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Standardize inventory quantities to 3 decimal places (HALF_UP rounding).
 */
export function toQuantity(val: DecimalValue): Decimal {
  return safeDecimal(val).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
}

/**
 * Standardize cost per base unit to 6 decimal places (HALF_UP rounding).
 */
export function toCostPerBase(val: DecimalValue): Decimal {
  return safeDecimal(val).toDecimalPlaces(6, Decimal.ROUND_HALF_UP);
}

/**
 * Standardize percentages to 2 decimal places (HALF_UP rounding).
 */
export function toPercent(val: DecimalValue): Decimal {
  return safeDecimal(val).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Round a monetary value to the nearest step (e.g. step 500, BR-06).
 * Uses HALF_UP rounding at the midpoint.
 * Example: roundToStep(19740, 500) -> 20000; roundToStep(19250, 500) -> 19500
 */
export function roundToStep(val: DecimalValue, step: number | Decimal = 500): Decimal {
  const decVal = safeDecimal(val);
  const decStep = safeDecimal(step);

  if (decStep.isZero() || decStep.isNegative()) {
    return toMoney(decVal);
  }

  return decVal
    .dividedBy(decStep)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .times(decStep)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Format Decimal to 2 decimal places string for API / database storage.
 */
export function toMoneyString(val: DecimalValue): string {
  return toMoney(val).toFixed(2);
}

/**
 * Format Decimal to 3 decimal places string for API / database storage.
 */
export function toQuantityString(val: DecimalValue): string {
  return toQuantity(val).toFixed(3);
}

/**
 * Format Decimal to 6 decimal places string for API / database storage.
 */
export function toCostPerBaseString(val: DecimalValue): string {
  return toCostPerBase(val).toFixed(6);
}

export { Decimal };
