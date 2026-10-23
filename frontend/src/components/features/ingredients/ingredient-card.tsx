import { Clock, CheckCircle2, Edit2, Trash2, Scale } from "lucide-react";
import type { Ingredient } from "@/api/hooks/use-ingredients";
import { formatNumber } from "@/lib/format";
import { CATEGORY_MAP } from "./types.js";

interface IngredientCardProps {
  item: Ingredient;
  onEdit: (item: Ingredient) => void;
  onManageUnits: (item: Ingredient) => void;
  onDeactivate: (item: Ingredient) => void;
}

export function IngredientCard({ item, onEdit, onManageUnits, onDeactivate }: IngredientCardProps) {
  const catMeta = CATEGORY_MAP[item.category];
  const yieldNum = Number(item.yieldPercent);
  const minStockNum = Number(item.minStockBase);

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 ${
        !item.isActive ? "bg-slate-50/50 opacity-80" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-slate-900 text-base">{item.name}</h4>
            {item.isPerishable && (
              <span title="Mudah rusak" className="text-amber-600">
                <Clock className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${catMeta.badgeClass}`}
            >
              {catMeta.label}
            </span>
            {item.isActive ? (
              <span className="inline-flex items-center gap-0.5 text-xs text-emerald-700 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Aktif</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400 font-medium">Nonaktif</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(item)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {item.isActive && (
            <button
              onClick={() => onDeactivate(item)}
              className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-2.5 text-xs border border-slate-100">
        <div>
          <span className="text-slate-500 block">Satuan Resep</span>
          <span className="font-bold text-slate-800 font-mono">{item.baseUnit.toLowerCase()}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Yield</span>
          <span
            className={`font-bold tabular-nums ${yieldNum < 100 ? "text-amber-600" : "text-emerald-700"}`}
          >
            {yieldNum}%
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Min. Stok</span>
          <span className="font-bold text-slate-800 tabular-nums">{formatNumber(minStockNum)}</span>
        </div>
      </div>

      <div className="space-y-1 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600">Satuan Beli</span>
          <button
            onClick={() => onManageUnits(item)}
            className="text-emerald-600 font-bold hover:underline flex items-center gap-1"
          >
            <Scale className="w-3 h-3" />
            <span>Kelola Satuan ({item.units.length})</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {item.units.length === 0 ? (
            <span className="text-xs text-slate-400 italic">
              Hanya satuan dasar ({item.baseUnit.toLowerCase()})
            </span>
          ) : (
            item.units.map((u) => (
              <span
                key={u.id}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono"
              >
                1 {u.name} = {formatNumber(Number(u.toBaseFactor))} {item.baseUnit.toLowerCase()}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
