import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, X, Loader2 } from "lucide-react";
import { ingredientFormSchema, type IngredientFormValues } from "./types";
import { IngredientPurchaseUnitFields } from "./ingredient-purchase-unit-fields";
import { IngredientPerishableField } from "./ingredient-perishable-field";

interface IngredientCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: IngredientFormValues) => Promise<void>;
  isLoading: boolean;
}

export function IngredientCreateModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: IngredientCreateModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: {
      name: "",
      category: "MAIN",
      baseUnit: "G",
      yieldPercent: 100,
      minStockBase: 0,
      isPerishable: false,
      purchaseUnitName: "",
      purchaseUnitFactor: undefined,
    },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit = async (values: IngredientFormValues) => {
    await onSubmit(values);
    reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Tambah Bahan Baku Baru</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Bahan Baku <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Misal: Kopi Robusta Blend, Susu UHT Full Cream"
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
                Kategori <span className="text-rose-500">*</span>
              </label>
              <select
                {...register("category")}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
              >
                <option value="MAIN">Bahan Utama (Kopi, Daging, Nasi)</option>
                <option value="SUPPORT">Bahan Pendukung (Gula, Sirup, Saus)</option>
                <option value="PACKAGING">Kemasan (Cup, Paperbag, Sedotan)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Satuan Dasar Resep <span className="text-rose-500">*</span>
              </label>
              <select
                {...register("baseUnit")}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white font-medium"
              >
                <option value="G">Gram (g) - padatan/bubuk</option>
                <option value="ML">Mililiter (ml) - cairan</option>
                <option value="PCS">Buah/Pcs (pcs) - per butir/lembar</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Satuan yang dipakai dalam penakaran resep.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Yield Persen (%) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="100"
                {...register("yieldPercent", { valueAsNumber: true })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {errors.yieldPercent ? (
                <p className="text-xs text-rose-500 mt-1 font-medium">
                  {errors.yieldPercent.message}
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1">
                  100% jika tanpa susut (mis. 80% bila ada susut 20%).
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batas Stok Minimum
              </label>
              <input
                type="number"
                step="0.001"
                placeholder="0"
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

          <IngredientPerishableField id="isPerishableCreate" register={register} />
          <IngredientPurchaseUnitFields register={register} />

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Bahan Baku</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
