import { useEffect, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ShoppingBag, Plus, Trash2, X, Loader2, Clock, Receipt } from "lucide-react";
import type { Ingredient } from "@/api/hooks/use-ingredients";
import { useCreatePurchase } from "@/api/hooks/use-purchases";
import { ApiError } from "@/api/client";
import { formatRupiah } from "@/lib/format";

const purchaseItemSchema = z.object({
  ingredientId: z.string().min(1, { error: "Pilih bahan" }),
  purchaseQty: z
    .number({ error: "Jumlah harus berupa angka" })
    .positive({ error: "Jumlah harus > 0" }),
  purchaseUnit: z.string().min(1, { error: "Pilih satuan" }),
  purchaseUnitPrice: z
    .number({ error: "Harga harus berupa angka" })
    .positive({ error: "Harga harus > 0" }),
  expiryDate: z.string().optional().nullable(),
});

const purchaseFormSchema = z.object({
  purchasedAt: z.string().min(1, { error: "Tanggal wajib diisi" }),
  supplierName: z.string().max(100).optional(),
  note: z.string().max(255).optional(),
  items: z.array(purchaseItemSchema).min(1).max(30),
});

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  onSuccess?: () => void;
}

export function PurchaseModal({ isOpen, onClose, ingredients, onSuccess }: PurchaseModalProps) {
  const createMutation = useCreatePurchase();
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0]!, []);

  // Filter active ingredients
  const activeIngredients = useMemo(
    () => ingredients.filter((item) => item.isActive),
    [ingredients]
  );

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      purchasedAt: todayStr,
      supplierName: "",
      note: "",
      items: [
        {
          ingredientId: activeIngredients[0]?.id ?? "",
          purchaseQty: 1,
          purchaseUnit: activeIngredients[0]?.baseUnit ?? "",
          purchaseUnitPrice: 10000,
          expiryDate: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = useWatch({
    control,
    name: "items",
  });

  // Calculate live total amount
  const totalAmount = useMemo(() => {
    if (!watchedItems) return 0;
    return watchedItems.reduce((sum, item) => {
      const qty = Number(item?.purchaseQty) || 0;
      const price = Number(item?.purchaseUnitPrice) || 0;
      return sum + qty * price;
    }, 0);
  }, [watchedItems]);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      reset({
        purchasedAt: todayStr,
        supplierName: "",
        note: "",
        items: [
          {
            ingredientId: activeIngredients[0]?.id ?? "",
            purchaseQty: 1,
            purchaseUnit: activeIngredients[0]?.baseUnit ?? "",
            purchaseUnitPrice: 10000,
            expiryDate: "",
          },
        ],
      });
    }
  }, [isOpen, reset, todayStr, activeIngredients]);

  if (!isOpen) return null;

  const handleIngredientChange = (index: number, ingredientId: string) => {
    const selected = activeIngredients.find((i) => i.id === ingredientId);
    if (selected) {
      setValue(`items.${index}.ingredientId`, ingredientId);
      setValue(`items.${index}.purchaseUnit`, selected.baseUnit);
    }
  };

  const onSubmit = async (values: PurchaseFormValues) => {
    // Validate that perishable items have expiry date
    for (let i = 0; i < values.items.length; i++) {
      const it = values.items[i]!;
      const ing = activeIngredients.find((x) => x.id === it.ingredientId);
      if (ing?.isPerishable && (!it.expiryDate || it.expiryDate.trim() === "")) {
        toast.error(
          `Baris ${i + 1}: Bahan "${ing.name}" mudah rusak dan wajib memiliki tanggal kedaluwarsa!`
        );
        return;
      }
    }

    try {
      const payload = {
        purchasedAt: values.purchasedAt,
        supplierName: values.supplierName?.trim() || undefined,
        note: values.note?.trim() || undefined,
        items: values.items.map((it) => ({
          ingredientId: it.ingredientId,
          purchaseQty: it.purchaseQty,
          purchaseUnit: it.purchaseUnit,
          purchaseUnitPrice: it.purchaseUnitPrice,
          expiryDate: it.expiryDate?.trim() || null,
        })),
      };

      const result = await createMutation.mutateAsync(payload);
      toast.success(
        `Nota belanja ${formatRupiah(Number(result.totalAmount))} berhasil disimpan. Stok batch telah dicatat!`
      );
      onClose();
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Gagal mencatat nota belanja. Periksa input Anda.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Catat Pembelian Baru (Nota Belanja)
              </h3>
              <p className="text-xs text-slate-500">
                Catat belanja bahan baku multi-baris beserta tanggal kedaluwarsa batch FEFO.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5"
        >
          {/* Header Info: Tanggal, Supplier, Catatan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Pembelian <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                max={todayStr}
                {...register("purchasedAt")}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {errors.purchasedAt && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.purchasedAt.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Toko / Supplier (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Pasar Induk, Toko Berkah"
                {...register("supplierName")}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Nota (Opsional)
              </label>
              <input
                type="text"
                placeholder="Misal: Belanja stok awal pekan"
                {...register("note")}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Baris Pembelian (Line Items) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Rincian Barang Belanja ({fields.length} baris)</span>
              </span>

              <button
                type="button"
                onClick={() =>
                  append({
                    ingredientId: activeIngredients[0]?.id ?? "",
                    purchaseQty: 1,
                    purchaseUnit: activeIngredients[0]?.baseUnit ?? "",
                    purchaseUnitPrice: 10000,
                    expiryDate: "",
                  })
                }
                disabled={fields.length >= 30}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition-all disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => {
                const currentIngredientId = watchedItems?.[index]?.ingredientId;
                const currentIngredient = activeIngredients.find(
                  (i) => i.id === currentIngredientId
                );

                const availableUnits: string[] = currentIngredient
                  ? [currentIngredient.baseUnit, ...currentIngredient.units.map((u) => u.name)]
                  : [];

                const itemQty = Number(watchedItems?.[index]?.purchaseQty) || 0;
                const itemPrice = Number(watchedItems?.[index]?.purchaseUnitPrice) || 0;
                const subtotal = itemQty * itemPrice;

                return (
                  <div
                    key={field.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
                  >
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
                          <span className="font-bold text-slate-900 tabular-nums">
                            {formatRupiah(subtotal)}
                          </span>
                        </span>

                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      {/* Ingredient Selector */}
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Bahan Baku <span className="text-rose-500">*</span>
                        </label>
                        <select
                          {...register(`items.${index}.ingredientId`)}
                          onChange={(e) => handleIngredientChange(index, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-500/20"
                        >
                          {activeIngredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.baseUnit.toLowerCase()})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Jumlah Beli */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Jumlah <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          placeholder="Misal 5"
                          {...register(`items.${index}.purchaseQty`, {
                            valueAsNumber: true,
                          })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      {/* Satuan Beli */}
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

                      {/* Harga Satuan */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Harga Satuan (Rp) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="100"
                          placeholder="25000"
                          {...register(`items.${index}.purchaseUnitPrice`, {
                            valueAsNumber: true,
                          })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>

                      {/* Tanggal Kedaluwarsa */}
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                          <span>Kedaluwarsa</span>
                          {currentIngredient?.isPerishable && (
                            <span className="text-rose-500">*</span>
                          )}
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
              })}
            </div>
          </div>

          {/* Footer Summary & Submit */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 block">Total Nilai Pembelian</span>
              <span className="text-2xl font-extrabold text-emerald-700 tracking-tight tabular-nums">
                {formatRupiah(totalAmount)}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || totalAmount <= 0}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan Nota...</span>
                  </>
                ) : (
                  <span>Simpan Nota Belanja</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
