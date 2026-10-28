import { z } from "zod";
import type { IngredientCategory } from "@/api/hooks/use-ingredients";

// Form Schema for Creating and Editing Ingredients
export const ingredientFormSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Nama bahan minimal 2 karakter" })
    .max(80, { error: "Nama bahan maksimal 80 karakter" }),
  category: z.enum(["MAIN", "SUPPORT", "PACKAGING"], {
    error: "Pilih kategori bahan",
  }),
  baseUnit: z.enum(["G", "ML", "PCS"], {
    error: "Pilih satuan dasar",
  }),
  yieldPercent: z
    .number({ error: "Yield harus berupa angka" })
    .min(1, { error: "Yield minimal 1%" })
    .max(100, { error: "Yield maksimal 100%" }),
  minStockBase: z
    .number({ error: "Batas stok harus berupa angka" })
    .min(0, { error: "Batas stok tidak boleh minus" }),
  isPerishable: z.boolean(),
  purchaseUnitName: z.string().optional(),
  purchaseUnitFactor: z.number().optional(),
});

export type IngredientFormValues = z.infer<typeof ingredientFormSchema>;

export const purchaseUnitFormSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Nama satuan tidak boleh kosong" })
    .max(30, { error: "Nama satuan maksimal 30 karakter" }),
  toBaseFactor: z
    .number({ error: "Faktor konversi harus berupa angka" })
    .positive({ error: "Faktor konversi harus lebih dari 0" }),
});

export type PurchaseUnitFormValues = z.infer<typeof purchaseUnitFormSchema>;

export const CATEGORY_MAP: Record<IngredientCategory, { label: string; badgeClass: string }> = {
  MAIN: {
    label: "Bahan Utama",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  SUPPORT: {
    label: "Bahan Pendukung",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  PACKAGING: {
    label: "Kemasan",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
};
