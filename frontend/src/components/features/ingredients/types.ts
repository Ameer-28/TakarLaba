import { z } from "zod";
import type { IngredientCategory } from "@/api/hooks/use-ingredients";

// Form Schema for Creating and Editing Ingredients
export const ingredientFormSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Ingredient name must be at least 2 characters" })
    .max(80, { error: "Ingredient name cannot exceed 80 characters" }),
  category: z.enum(["MAIN", "SUPPORT", "PACKAGING"], {
    error: "Please select an ingredient category",
  }),
  baseUnit: z.enum(["G", "ML", "PCS"], {
    error: "Please select a base unit",
  }),
  yieldPercent: z
    .number({ error: "Yield must be a number" })
    .min(1, { error: "Yield must be at least 1%" })
    .max(100, { error: "Yield cannot exceed 100%" }),
  minStockBase: z
    .number({ error: "Stock threshold must be a number" })
    .min(0, { error: "Stock threshold cannot be negative" }),
  isPerishable: z.boolean(),
  purchaseUnitName: z.string().optional(),
  purchaseUnitFactor: z.number().optional(),
});

export type IngredientFormValues = z.infer<typeof ingredientFormSchema>;

export const purchaseUnitFormSchema = z.object({
  name: z
    .string()
    .min(1, { error: "Unit name cannot be empty" })
    .max(30, { error: "Unit name cannot exceed 30 characters" }),
  toBaseFactor: z
    .number({ error: "Conversion factor must be a number" })
    .positive({ error: "Conversion factor must be greater than 0" }),
});

export type PurchaseUnitFormValues = z.infer<typeof purchaseUnitFormSchema>;

export const CATEGORY_MAP: Record<IngredientCategory, { label: string; badgeClass: string }> = {
  MAIN: {
    label: "Main Ingredient",
    badgeClass: "bg-sky-50 text-sky-700 border-transparent",
  },
  SUPPORT: {
    label: "Supporting Ingredient",
    badgeClass: "bg-slate-100 text-slate-600 border-transparent",
  },
  PACKAGING: {
    label: "Packaging",
    badgeClass: "bg-amber-50 text-amber-700 border-transparent",
  },
};
