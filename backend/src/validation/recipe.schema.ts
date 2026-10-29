import { z } from "zod";

export const recipeItemInputSchema = z.object({
  ingredientId: z
    .string({ error: "Bahan baku wajib dipilih" })
    .min(1, { error: "Bahan baku wajib dipilih" }),
  qtyUsable: z
    .union([z.number(), z.string()], { error: "Jumlah takaran bahan wajib diisi" })
    .refine(
      (val) => {
        const num = typeof val === "number" ? val : parseFloat(val);
        return !isNaN(num) && num > 0 && num <= 1_000_000;
      },
      { error: "Jumlah takaran bahan harus lebih besar dari 0 dan maksimal 1.000.000" }
    ),
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
  sellingPrice: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        if (val === undefined || val === null || val === "") return true;
        const num = typeof val === "number" ? val : parseFloat(val);
        return !isNaN(num) && num > 0 && num <= 100_000_000;
      },
      { error: "Harga jual harus lebih besar dari 0 dan maksimal 100.000.000" }
    )
    .optional(),
  targetMargin: z
    .union([z.number(), z.string()])
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (val === null || val === undefined || val === "") return true;
        const num = typeof val === "number" ? val : parseFloat(val);
        return !isNaN(num) && num >= 0 && num <= 95;
      },
      { error: "Target margin harus antara 0% dan 95%" }
    ),
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
