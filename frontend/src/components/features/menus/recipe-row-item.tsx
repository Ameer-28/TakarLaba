import { Trash2 } from "lucide-react";
import type { Ingredient } from "../../../api/hooks/use-ingredients.js";
import { formatRupiah } from "../../../lib/format.js";

export interface EditorRow {
  rowId: string;
  ingredientId: string;
  qtyUsable: string;
  unitName: string;
}

interface RecipeRowItemProps {
  row: EditorRow;
  index: number;
  ingredients: Ingredient[];
  ingredientMap: Map<string, Ingredient>;
  subtotal?: string;
  canRemove: boolean;
  onRemove: (rowId: string) => void;
  onChange: (
    rowId: string,
    field: "ingredientId" | "qtyUsable" | "unitName",
    value: string
  ) => void;
}

export function RecipeRowItem({
  row,
  index,
  ingredients,
  ingredientMap,
  subtotal,
  canRemove,
  onRemove,
  onChange,
}: RecipeRowItemProps) {
  const selectedIng = ingredientMap.get(row.ingredientId);

  const availableUnits: string[] = [];
  if (selectedIng) {
    availableUnits.push(selectedIng.baseUnit);
    selectedIng.units.forEach((u) => {
      if (!availableUnits.includes(u.name)) {
        availableUnits.push(u.name);
      }
    });
  }

  return (
    <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2 group hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-400 shrink-0">#{index + 1}</span>
        <div className="flex-1 min-w-0">
          <select
            value={row.ingredientId}
            onChange={(e) => onChange(row.rowId, "ingredientId", e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
          >
            {ingredients.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.name} ({ing.baseUnit}) - Yield {Math.round(Number(ing.yieldPercent))}%
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => onRemove(row.rowId)}
          disabled={!canRemove}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
          title="Hapus baris bahan"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Takaran Resep
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0.001"
              step="any"
              value={row.qtyUsable}
              onChange={(e) => onChange(row.rowId, "qtyUsable", e.target.value)}
              placeholder="0"
              className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all tabular-nums text-slate-900"
            />
            <select
              value={row.unitName}
              onChange={(e) => onChange(row.rowId, "unitName", e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 shrink-0"
            >
              {availableUnits.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-32 text-right">
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Subtotal Biaya
          </span>
          <span className="text-xs font-bold text-slate-800 tabular-nums">
            {subtotal ? formatRupiah(subtotal) : "Rp-"}
          </span>
        </div>
      </div>
    </div>
  );
}
