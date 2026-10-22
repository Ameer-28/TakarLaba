import { z } from "zod";

export const baseUnitEnum = z.enum(["G", "ML", "PCS"], {
  error: "Satuan dasar harus salah satu dari: G, ML, PCS",
});

export const ingredientCategoryEnum = z.enum(["MAIN", "SUPPORT", "PACKAGING"], {
  error: "Kategori harus salah satu dari: MAIN, SUPPORT, PACKAGING",
});

export const purchaseUnitInputSchema = z.object({
  name: z
    .string({ error: "Nama satuan pembelian wajib diisi" })
    .trim()
    .min(1, { error: "Nama satuan pembelian tidak boleh kosong" })
    .max(50, { error: "Nama satuan maksimal 50 karakter" }),
  toBaseFactor: z
    .number({ error: "Faktor konversi wajib berupa angka" })
    .positive({ error: "Faktor konversi harus lebih besar dari 0" }),
});

export const createIngredientSchema = z.object({
  name: z
    .string({ error: "Nama bahan wajib diisi" })
    .trim()
    .min(2, { error: "Nama bahan minimal 2 karakter" })
    .max(100, { error: "Nama bahan maksimal 100 karakter" }),
  category: ingredientCategoryEnum,
  baseUnit: baseUnitEnum,
  yieldPercent: z
    .number({ error: "Yield persen wajib berupa angka" })
    .min(1, { error: "Yield minimal 1%" })
    .max(100, { error: "Yield maksimal 100%" })
    .default(100),
  isPerishable: z.boolean().default(false),
  minStockBase: z
    .number({ error: "Batas minimum stok wajib berupa angka" })
    .min(0, { error: "Batas minimum stok tidak boleh negatif" })
    .default(0),
  purchaseUnits: z.array(purchaseUnitInputSchema).optional(),
});

export const updateIngredientSchema = z.object({
  name: z
    .string({ error: "Nama bahan harus berupa teks" })
    .trim()
    .min(2, { error: "Nama bahan minimal 2 karakter" })
    .max(100, { error: "Nama bahan maksimal 100 karakter" })
    .optional(),
  category: ingredientCategoryEnum.optional(),
  baseUnit: baseUnitEnum.optional(),
  yieldPercent: z
    .number({ error: "Yield persen wajib berupa angka" })
    .min(1, { error: "Yield minimal 1%" })
    .max(100, { error: "Yield maksimal 100%" })
    .optional(),
  isPerishable: z.boolean().optional(),
  minStockBase: z
    .number({ error: "Batas minimum stok wajib berupa angka" })
    .min(0, { error: "Batas minimum stok tidak boleh negatif" })
    .optional(),
  isActive: z.boolean().optional(),
});

export const queryIngredientSchema = z.object({
  search: z.string().trim().optional(),
  category: ingredientCategoryEnum.optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
});

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;
export type QueryIngredientInput = z.infer<typeof queryIngredientSchema>;
export type PurchaseUnitInput = z.infer<typeof purchaseUnitInputSchema>;
