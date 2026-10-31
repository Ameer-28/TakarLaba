import { z } from "zod";
import { Decimal } from "decimal.js";

export interface DecimalInputOptions {
  positive?: boolean;
  nonNegative?: boolean;
  min?: number | string;
  max?: number | string;
  allowEmpty?: boolean;
  error?: string;
}

/**
 * Validates decimal inputs accepting either number or string.
 * Uses decimal.js for precise numeric bounds checking.
 */
export function decimalInput(options?: DecimalInputOptions) {
  return z
    .union([z.number(), z.string()], {
      error: options?.error ?? "Nilai harus berupa angka atau teks angka desimal",
    })
    .refine(
      (val) => {
        if (typeof val === "string" && val.trim() === "") {
          return !!options?.allowEmpty;
        }
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
        error: options?.error ?? "Format angka desimal tidak valid",
      }
    );
}

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
          error: options?.error ?? "Format angka desimal tidak valid",
        }
      )
  );
}
