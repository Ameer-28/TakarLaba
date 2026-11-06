import { Clock, Edit2, Trash2, Scale } from "lucide-react";
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
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/70 border-b border-slate-200/80">
              <tr className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Ingredient Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Base Unit</th>
                <th className="py-3 px-4">Yield</th>
                <th className="py-3 px-4">Min. Stock</th>
                <th className="py-3 px-4">Purchase Units</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
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
                    className={`hover:bg-slate-50/50 transition-colors ${
                      !item.isActive ? "bg-slate-50/30 text-slate-400" : ""
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{item.name}</span>
                        {item.isPerishable && (
                          <span title="Perishable / has expiration date" className="text-amber-500">
                            <Clock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${catMeta.badgeClass}`}
                      >
                        {catMeta.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-600">
                      {item.baseUnit.toLowerCase()}
                    </td>
                    <td className="py-3 px-4">
                      {yieldNum < 100 ? (
                        <div className="flex items-center gap-1 text-xs tabular-nums font-semibold text-amber-600">
                          <span>{yieldNum}%</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            (-{100 - yieldNum}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs tabular-nums text-slate-400 font-medium">
                          100%
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 tabular-nums text-xs font-medium text-slate-700">
                      {formatNumber(minStockNum)} {item.baseUnit.toLowerCase()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                        {item.units.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">None yet</span>
                        ) : (
                          item.units.map((u) => (
                            <span
                              key={u.id}
                              className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-xs border border-slate-200/60"
                            >
                              1 {u.name} = {formatNumber(Number(u.toBaseFactor))}{" "}
                              {item.baseUnit.toLowerCase()}
                            </span>
                          ))
                        )}
                        <button
                          type="button"
                          onClick={() => onManageUnits(item)}
                          title="Manage Purchase Units"
                          className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline inline-flex items-center gap-1 ml-0.5 cursor-pointer"
                        >
                          <Scale className="w-3 h-3 text-slate-400" />
                          <span>Manage</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {item.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          title="Edit Ingredient"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {item.isActive && (
                          <button
                            type="button"
                            onClick={() => onDeactivate(item)}
                            title="Deactivate Ingredient"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
