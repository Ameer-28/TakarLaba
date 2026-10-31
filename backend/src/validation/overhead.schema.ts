import { z } from "zod";
import { decimalInput } from "./decimal.js";

export const overheadTypeEnum = z.enum(["UTILITY", "LABOR", "DEPRECIATION", "OTHER"], {
  error: "Tipe overhead harus salah satu dari: UTILITY, LABOR, DEPRECIATION, OTHER",
});

export const createOverheadSchema = z.object({
  name: z
    .string({ error: "Nama beban overhead wajib diisi" })
    .trim()
    .min(2, { error: "Nama beban overhead minimal 2 karakter" })
    .max(80, { error: "Nama beban overhead maksimal 80 karakter" }),
  type: overheadTypeEnum,
  monthlyAmount: decimalInput({
    min: 0,
    max: 1_000_000_000,
    error: "Nominal bulanan harus bernilai positif atau 0 (maksimal 1.000.000.000)",
  }),
  isActive: z.boolean().default(true),
});

export const updateOverheadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Nama beban overhead minimal 2 karakter" })
    .max(80, { error: "Nama beban overhead maksimal 80 karakter" })
    .optional(),
  type: overheadTypeEnum.optional(),
  monthlyAmount: decimalInput({
    min: 0,
    max: 1_000_000_000,
    error: "Nominal bulanan harus bernilai positif atau 0 (maksimal 1.000.000.000)",
  }).optional(),
  isActive: z.boolean().optional(),
});

export type CreateOverheadInput = z.infer<typeof createOverheadSchema>;
export type UpdateOverheadInput = z.infer<typeof updateOverheadSchema>;
