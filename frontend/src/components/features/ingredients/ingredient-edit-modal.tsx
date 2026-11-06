import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, X, Loader2, Info } from "lucide-react";
import type { Ingredient } from "@/api/hooks/use-ingredients";
import { ingredientFormSchema, type IngredientFormValues } from "./types";
import { IngredientPerishableField } from "./ingredient-perishable-field";

interface IngredientEditModalProps {
  ingredient: Ingredient | null;
  onClose: () => void;
  onSubmit: (values: IngredientFormValues) => Promise<void>;
  isLoading: boolean;
}

export function IngredientEditModal({
  ingredient,
  onClose,
  onSubmit,
  isLoading,
}: IngredientEditModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientFormSchema),
  });

  useEffect(() => {
    if (ingredient) {
      reset({
        name: ingredient.name,
        category: ingredient.category,
        baseUnit: ingredient.baseUnit,
        yieldPercent: Number(ingredient.yieldPercent),
        minStockBase: Number(ingredient.minStockBase),
        isPerishable: ingredient.isPerishable,
      });
    }
  }, [ingredient, reset]);

  if (!ingredient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Edit2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Edit Ingredient</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ingredient Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register("name")}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
            {errors.name && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                {...register("category")}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
              >
                <option value="MAIN">Main Ingredient</option>
                <option value="SUPPORT">Supporting Ingredient</option>
                <option value="PACKAGING">Packaging</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Recipe Base Unit
              </label>
              <select
                {...register("baseUnit")}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-600 font-medium cursor-not-allowed"
                disabled
              >
                <option value="G">Gram (g)</option>
                <option value="ML">Milliliter (ml)</option>
                <option value="PCS">Piece/Pcs (pcs)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400 inline" />
                <span>Base unit locked for recipe &amp; batch consistency.</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Yield Percent (%) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register("yieldPercent", { valueAsNumber: true })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {errors.yieldPercent && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {errors.yieldPercent.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Minimum Stock Threshold
              </label>
              <input
                type="number"
                step="0.001"
                {...register("minStockBase", { valueAsNumber: true })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {errors.minStockBase && (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {errors.minStockBase.message}
                </p>
              )}
            </div>
          </div>

          <IngredientPerishableField
            id="isPerishableEdit"
            register={register}
            description="Requires an expiration date on every purchase batch."
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
