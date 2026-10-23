import type { UseFormRegister } from "react-hook-form";
import type { IngredientFormValues } from "./types";

interface IngredientPurchaseUnitFieldsProps {
  register: UseFormRegister<IngredientFormValues>;
}

export function IngredientPurchaseUnitFields({ register }: IngredientPurchaseUnitFieldsProps) {
  return (
    <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 space-y-2">
      <span className="text-xs font-bold text-slate-800 block">
        Satuan Beli Tambahan (Opsional)
      </span>
      <p className="text-[11px] text-slate-500">
        Bila Anda sering membeli dalam satuan yang berbeda dari resep (misal: beli per "kg" atau
        "karton").
      </p>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div>
          <input
            type="text"
            placeholder="Nama satuan (kg, liter)"
            {...register("purchaseUnitName")}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
          />
        </div>
        <div>
          <input
            type="number"
            step="0.0001"
            placeholder="Faktor (misal 1000)"
            {...register("purchaseUnitFactor", { valueAsNumber: true })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
