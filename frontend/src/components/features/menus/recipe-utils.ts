import type { RecipeItemInput } from "../../../api/hooks/use-menus.js";
import type { EditorRow } from "./recipe-row-item.js";

export interface RecipeValidationResult {
  validItems: RecipeItemInput[];
  error: string | null;
}

export function validateRecipeRows(rows: EditorRow[]): RecipeValidationResult {
  if (rows.length === 0) {
    return { validItems: [], error: "Resep minimal harus memiliki 1 bahan" };
  }

  const validItems: RecipeItemInput[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    const qtyNum = Number(r.qtyUsable);
    if (!r.ingredientId) {
      return { validItems: [], error: `Baris ${i + 1}: Bahan baku belum dipilih` };
    }
    if (isNaN(qtyNum) || qtyNum <= 0) {
      return { validItems: [], error: `Baris ${i + 1}: Jumlah takaran harus lebih dari 0` };
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
      error: "Terdapat bahan baku yang sama berulang kali. Silakan gabungkan takarannya.",
    };
  }

  return { validItems, error: null };
}
