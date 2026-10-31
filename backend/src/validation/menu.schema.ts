import { z } from "zod";
import { decimalInput } from "./decimal.js";

export const createMenuSchema = z.object({
  name: z
    .string({ error: "Nama menu wajib diisi" })
    .trim()
    .min(2, { error: "Nama menu minimal 2 karakter" })
    .max(100, { error: "Nama menu maksimal 100 karakter" }),
  category: z
    .string()
    .trim()
    .max(50, { error: "Kategori maksimal 50 karakter" })
    .nullable()
    .optional(),
  sellingPrice: decimalInput({
    positive: true,
    max: 100_000_000,
    error: "Harga jual harus lebih besar dari 0 dan maksimal 100.000.000",
  }),
  targetMargin: decimalInput({
    min: 0,
    max: 95,
    allowEmpty: true,
    error: "Target margin harus antara 0% dan 95%",
  })
    .nullable()
    .optional(),
  isActive: z.boolean().default(true),
});

export const updateMenuSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Nama menu minimal 2 karakter" })
    .max(100, { error: "Nama menu maksimal 100 karakter" })
    .optional(),
  category: z
    .string()
    .trim()
    .max(50, { error: "Kategori maksimal 50 karakter" })
    .nullable()
    .optional(),
  sellingPrice: decimalInput({
    positive: true,
    max: 100_000_000,
    error: "Harga jual harus lebih besar dari 0 dan maksimal 100.000.000",
  }).optional(),
  targetMargin: decimalInput({
    min: 0,
    max: 95,
    allowEmpty: true,
    error: "Target margin harus antara 0% dan 95%",
  })
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
