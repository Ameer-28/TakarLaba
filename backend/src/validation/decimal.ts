import { z } from "zod";
import { Decimal } from "decimal.js";

export interface DecimalStringOptions {
  positive?: boolean;
  nonNegative?: boolean;
  min?: number | string;
  max?: number | string;
  error?: string;
}

/**
 * Validates and normalizes decimal string input for money and quantities.
 * Accepts strings directly and numbers with tolerance/coercion during transitions.
 */
export function decimalString(options?: DecimalStringOptions) {
  return z.preprocess(
    (val) => {
      if (typeof val === "number") return String(val);
      return val;
    },
    z
      .string({ error: options?.error ?? "Nilai harus berupa teks angka desimal" })
      .trim()
      .refine(
        (val) => {
          try {
            const d = new Decimal(val);
            if (options?.positive && !d.greaterThan(0)) return false;
            if (options?.nonNegative && d.isNegative()) return false;
            if (options?.min !== undefined && d.lessThan(new Decimal(options.min))) return false;
            if (options?.max !== undefined && d.greaterThan(new Decimal(options.max))) return false;
            return true;
          } catch {
            return false;
          }
        },
        {
          message: options?.error ?? "Format angka desimal tidak valid",
        }
      )
  );
}
