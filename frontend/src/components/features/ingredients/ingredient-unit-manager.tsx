import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Scale, Sparkles, Plus, Trash2, X, Loader2 } from "lucide-react";
import type { Ingredient } from "@/api/hooks/use-ingredients";
import { formatNumber } from "@/lib/format";
import { purchaseUnitFormSchema, type PurchaseUnitFormValues } from "./types";

interface IngredientUnitManagerProps {
  ingredient: Ingredient | null;
  onClose: () => void;
  onAddUnit: (values: PurchaseUnitFormValues) => Promise<void>;
  onDeleteUnit: (unitId: string, unitName: string) => Promise<void>;
  isAddingUnit: boolean;
}

export function IngredientUnitManager({
  ingredient,
  onClose,
  onAddUnit,
  onDeleteUnit,
  isAddingUnit,
}: IngredientUnitManagerProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PurchaseUnitFormValues>({
    resolver: zodResolver(purchaseUnitFormSchema),
    defaultValues: {
      name: "",
      toBaseFactor: undefined,
    },
  });

  if (!ingredient) return null;

  const handleFormSubmit = async (values: PurchaseUnitFormValues) => {
    await onAddUnit(values);
    reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Konversi Satuan Beli</h3>
              <p className="text-xs text-slate-500">
                Bahan: <span className="font-semibold text-slate-800">{ingredient.name}</span>{" "}
                (satuan dasar: {ingredient.baseUnit.toLowerCase()})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Form Tambah Satuan */}
          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-800">Tambah Satuan Konversi Baru</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Satuan Beli
                </label>
                <input
                  type="text"
                  placeholder="Misal: kg, liter, ikat, karung"
                  {...register("name")}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
                />
                {errors.name && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Faktor ke {ingredient.baseUnit.toLowerCase()}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Misal: 1000"
                  {...register("toBaseFactor", { valueAsNumber: true })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white"
                />
                {errors.toBaseFactor && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.toBaseFactor.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isAddingUnit}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs disabled:opacity-60 transition-all"
              >
                {isAddingUnit ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Menambahkan...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Satuan</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Daftar Satuan yang Ada */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-800 block">
              Daftar Satuan Beli Terdaftar ({ingredient.units.length})
            </span>

            {ingredient.units.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                Belum ada konversi tambahan. Nota belanja hanya dapat menggunakan satuan dasar (
                {ingredient.baseUnit.toLowerCase()}).
              </p>
            ) : (
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                {ingredient.units.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <span className="font-semibold text-slate-800 text-sm font-mono">
                        1 {unit.name}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        = {formatNumber(Number(unit.toBaseFactor))}{" "}
                        {ingredient.baseUnit.toLowerCase()}
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteUnit(unit.id, unit.name)}
                      title="Hapus Satuan"
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
