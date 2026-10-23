import type { UseFormRegister } from "react-hook-form";
import type { IngredientFormValues } from "./types";

interface IngredientPerishableFieldProps {
  id: string;
  register: UseFormRegister<IngredientFormValues>;
  description?: string;
}

export function IngredientPerishableField({
  id,
  register,
  description = "Wajib mengisi tanggal kedaluwarsa saat mencatat nota belanja untuk penerapan FEFO.",
}: IngredientPerishableFieldProps) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <input
        type="checkbox"
        id={id}
        {...register("isPerishable")}
        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
      />
      <label htmlFor={id} className="text-xs text-slate-700 cursor-pointer">
        <span className="font-bold block text-slate-900">
          Bahan mudah rusak / memiliki tanggal kedaluwarsa
        </span>
        {description}
      </label>
    </div>
  );
}
