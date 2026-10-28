import type { UseFormRegister } from "react-hook-form";
import { Clock, Trash2 } from "lucide-react";
import type { Ingredient } from "@/api/hooks/use-ingredients";
import { formatRupiah } from "@/lib/format";
import type { PurchaseFormValues, PurchaseItemValues } from "./purchase-form-types";

interface PurchaseLineItemProps {
  index: number;
  fieldId: string;
  activeIngredients: Ingredient[];
  register: UseFormRegister<PurchaseFormValues>;
  watchedItem?: PurchaseItemValues;
  todayStr: string;
  canRemove: boolean;
  onRemove: () => void;
  onIngredientChange: (ingredientId: string) => void;
}

export function PurchaseLineItem({
  index,
  activeIngredients,
  register,
  watchedItem,
  todayStr,
  canRemove,
  onRemove,
  onIngredientChange,
}: PurchaseLineItemProps) {
  const currentIngredientId = watchedItem?.ingredientId;
  const currentIngredient = activeIngredients.find((i) => i.id === currentIngredientId);
  const availableUnits: string[] = currentIngredient
    ? [currentIngredient.baseUnit, ...currentIngredient.units.map((u) => u.name)]
    : [];

  const itemQty = Number(watchedItem?.purchaseQty) || 0;
  const itemPrice = Number(watchedItem?.purchaseUnitPrice) || 0;
  const subtotal = itemQty * itemPrice;

  return (
    <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center font-mono">
            {index + 1}
          </span>
          {currentIngredient?.isPerishable && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>Wajib Kedaluwarsa</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Subtotal:{" "}
            <span className="font-bold text-slate-900 tabular-nums">{formatRupiah(subtotal)}</span>
          </span>

          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
              title="Hapus baris ini"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        <div className="sm:col-span-4">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Bahan Baku <span className="text-rose-500">*</span>
          </label>
          <select
            {...register(`items.${index}.ingredientId`)}
            onChange={(e) => onIngredientChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-500/20"
          >
            {activeIngredients.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {ing.name} ({ing.baseUnit.toLowerCase()})
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Jumlah <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="0.001"
            placeholder="Misal 5"
            {...register(`items.${index}.purchaseQty`, { valueAsNumber: true })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Satuan Beli <span className="text-rose-500">*</span>
          </label>
          <select
            {...register(`items.${index}.purchaseUnit`)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-500/20"
          >
            {availableUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Harga Satuan (Rp) <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="100"
            placeholder="25000"
            {...register(`items.${index}.purchaseUnitPrice`, { valueAsNumber: true })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
            <span>Kedaluwarsa</span>
            {currentIngredient?.isPerishable && <span className="text-rose-500">*</span>}
          </label>
          <input
            type="date"
            min={todayStr}
            {...register(`items.${index}.expiryDate`)}
            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>
    </div>
  );
}
