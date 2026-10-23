import { Clock, CheckCircle2, Edit2, Trash2, Scale } from "lucide-react";
import type { Ingredient } from "@/api/hooks/use-ingredients";
import { formatNumber } from "@/lib/format";
import { CATEGORY_MAP } from "./types";
import { IngredientCard } from "./ingredient-card";

interface IngredientTableProps {
  ingredients: Ingredient[];
  onEdit: (item: Ingredient) => void;
  onManageUnits: (item: Ingredient) => void;
  onDeactivate: (item: Ingredient) => void;
}

export function IngredientTable({
  ingredients,
  onEdit,
  onManageUnits,
  onDeactivate,
}: IngredientTableProps) {
  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold text-slate-600">
                <th className="py-3.5 px-4">Nama Bahan</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Satuan Dasar</th>
                <th className="py-3.5 px-4">Yield (%)</th>
                <th className="py-3.5 px-4">Batas Min. Stok</th>
                <th className="py-3.5 px-4">Satuan Beli</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {ingredients.map((item) => {
                const catMeta = CATEGORY_MAP[item.category];
                const yieldNum = Number(item.yieldPercent);
                const minStockNum = Number(item.minStockBase);

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/60 transition-colors ${!item.isActive ? "bg-slate-50/40 text-slate-400" : ""}`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                        {item.isPerishable && (
                          <span
                            title="Mudah rusak / ada batas kedaluwarsa"
                            className="text-amber-600"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${catMeta.badgeClass}`}
                      >
                        {catMeta.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {item.baseUnit.toLowerCase()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 tabular-nums">
                        <span
                          className={`font-semibold ${yieldNum < 100 ? "text-amber-600" : "text-emerald-700"}`}
                        >
                          {yieldNum}%
                        </span>
                        {yieldNum < 100 && (
                          <span className="text-xs text-slate-400">(susut {100 - yieldNum}%)</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 tabular-nums font-mono text-slate-700">
                      {formatNumber(minStockNum)} {item.baseUnit.toLowerCase()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                        {item.units.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">
                            Belum ada satuan beli
                          </span>
                        ) : (
                          item.units.map((u) => (
                            <span
                              key={u.id}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200"
                            >
                              1 {u.name} = {formatNumber(Number(u.toBaseFactor))}{" "}
                              {item.baseUnit.toLowerCase()}
                            </span>
                          ))
                        )}
                        <button
                          onClick={() => onManageUnits(item)}
                          title="Kelola Satuan Beli"
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-0.5 ml-1"
                        >
                          <Scale className="w-3 h-3" />
                          <span>Kelola</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(item)}
                          title="Ubah Bahan Baku"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {item.isActive && (
                          <button
                            onClick={() => onDeactivate(item)}
                            title="Nonaktifkan Bahan"
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {ingredients.map((item) => (
          <IngredientCard
            key={item.id}
            item={item}
            onEdit={onEdit}
            onManageUnits={onManageUnits}
            onDeactivate={onDeactivate}
          />
        ))}
      </div>
    </div>
  );
}
