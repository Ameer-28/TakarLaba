import type { RecipeItemInput } from "../../../api/hooks/use-menus.js";
import type { EditorRow } from "./recipe-row-item.js";

export interface RecipeValidationResult {
  validItems: RecipeItemInput[];
  error: string | null;
}

export function validateRecipeRows(rows: EditorRow[]): RecipeValidationResult {
  if (rows.length === 0) {
    return { validItems: [], error: "Recipe must have at least 1 ingredient" };
  }

  const validItems: RecipeItemInput[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    const qtyNum = Number(r.qtyUsable);
    if (!r.ingredientId) {
      return { validItems: [], error: `Row ${i + 1}: Ingredient not selected` };
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      return { validItems: [], error: `Row ${i + 1}: Quantity must be greater than 0` };
    }
    validItems.push({
      ingredientId: r.ingredientId,
      qtyUsable: qtyNum,
      unitName: r.unitName || undefined,
    });
  }

  const ids = validItems.map((i) => i.ingredientId);
  if (new Set(ids).size !== ids.length) {
    return {
      validItems: [],
      error: "Duplicate ingredients found. Please combine their quantities.",
    };
  }

  return { validItems, error: null };
}
