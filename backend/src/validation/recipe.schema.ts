import { z } from "zod";
import { decimalInput } from "./decimal.js";

export const recipeItemInputSchema = z.object({
  ingredientId: z
    .string({ error: "Bahan baku wajib dipilih" })
    .min(1, { error: "Bahan baku wajib dipilih" }),
  qtyUsable: decimalInput({
    positive: true,
    max: 1_000_000,
    error: "Jumlah takaran bahan harus lebih besar dari 0 dan maksimal 1.000.000",
  }),
  unitName: z
    .string()
    .trim()
    .max(50, { error: "Satuan takaran maksimal 50 karakter" })
    .optional()
    .nullable(),
});

export const saveRecipeSchema = z.object({
  items: z
    .array(recipeItemInputSchema, { error: "Daftar bahan resep wajib diisi" })
    .min(1, { error: "Resep minimal harus berisi 1 bahan baku" })
    .max(30, { error: "Resep maksimal 30 bahan baku" })
    .refine(
      (items) => {
        const ids = items.map((i) => i.ingredientId);
        return new Set(ids).size === ids.length;
      },
      {
        error:
          "Terdapat bahan baku duplikat dalam resep. Harap gabungkan takaran untuk bahan yang sama.",
      }
    ),
});

export const previewCostSchema = z.object({
  menuId: z.string().optional(),
  sellingPrice: decimalInput({
    positive: true,
    max: 100_000_000,
    allowEmpty: true,
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
  items: z
    .array(recipeItemInputSchema)
    .max(30, { error: "Resep maksimal 30 bahan baku" })
    .refine(
      (items) => {
        const ids = items.map((i) => i.ingredientId);
        return new Set(ids).size === ids.length;
      },
      { error: "Terdapat bahan baku duplikat dalam draf resep" }
    ),
});

export type RecipeItemInput = z.infer<typeof recipeItemInputSchema>;
export type SaveRecipeInput = z.infer<typeof saveRecipeSchema>;
export type PreviewCostInput = z.infer<typeof previewCostSchema>;
