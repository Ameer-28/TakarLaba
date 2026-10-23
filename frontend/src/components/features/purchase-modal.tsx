import { useEffect, useMemo } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Sparkles } from "lucide-react";
import { useCreatePurchase } from "@/api/hooks/use-purchases";
import type { Ingredient } from "@/api/hooks/use-ingredients";
import { ApiError } from "@/api/client";
import { purchaseFormSchema, type PurchaseFormValues } from "./purchases/purchase-form-types";
import { PurchaseLineItem } from "./purchases/purchase-line-item";
import { PurchaseInvoiceFields } from "./purchases/purchase-invoice-fields";
import { PurchaseModalFooter } from "./purchases/purchase-modal-footer";
import { PurchaseModalHeader } from "./purchases/purchase-modal-header";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredients: Ingredient[];
  onSuccess?: () => void;
}

export function PurchaseModal({ isOpen, onClose, ingredients, onSuccess }: PurchaseModalProps) {
  const createMutation = useCreatePurchase();
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0]!, []);
  const activeIngredients = useMemo(() => ingredients.filter((i) => i.isActive), [ingredients]);
  const defaultIngredient = activeIngredients[0];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      invoiceNumber: "",
      supplierName: "",
      purchasedAt: todayStr,
      items: [
        {
          ingredientId: defaultIngredient?.id || "",
          purchaseUnit: defaultIngredient?.baseUnit || "G",
          purchaseQty: 1,
          purchaseUnitPrice: 10000,
          expiryDate: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" });

  const totalAmount = useMemo(() => {
    if (!watchedItems) return 0;
    return watchedItems.reduce((acc, item) => {
      const qty = Number(item?.purchaseQty) || 0;
      const price = Number(item?.purchaseUnitPrice) || 0;
      return acc + qty * price;
    }, 0);
  }, [watchedItems]);

  useEffect(() => {
    if (isOpen && activeIngredients.length > 0 && fields.length === 0) {
      reset({
        invoiceNumber: "",
        supplierName: "",
        purchasedAt: todayStr,
        items: [
          {
            ingredientId: activeIngredients[0]!.id,
            purchaseUnit: activeIngredients[0]!.baseUnit,
            purchaseQty: 1,
            purchaseUnitPrice: 10000,
            expiryDate: "",
          },
        ],
      });
    }
  }, [isOpen, activeIngredients, fields.length, reset, todayStr]);

  const handleIngredientChange = (index: number, ingredientId: string) => {
    const selected = activeIngredients.find((i) => i.id === ingredientId);
    if (selected) {
      setValue(`items.${index}.ingredientId`, selected.id);
      setValue(`items.${index}.purchaseUnit`, selected.baseUnit);
    }
  };

  const onSubmit = async (values: PurchaseFormValues) => {
    for (let i = 0; i < values.items.length; i++) {
      const it = values.items[i]!;
      const ing = activeIngredients.find((x) => x.id === it.ingredientId);
      if (ing?.isPerishable && !it.expiryDate) {
        toast.error(`Bahan "${ing.name}" mudah rusak. Wajib menyertakan tanggal kedaluwarsa.`);
        return;
      }
    }

    try {
      const payload = {
        invoiceNumber: values.invoiceNumber?.trim() || undefined,
        supplierName: values.supplierName?.trim() || undefined,
        purchasedAt: values.purchasedAt,
        items: values.items.map((it) => ({
          ingredientId: it.ingredientId,
          purchaseUnit: it.purchaseUnit,
          purchaseQty: String(it.purchaseQty),
          purchaseUnitPrice: String(it.purchaseUnitPrice),
          expiryDate: it.expiryDate ? `${it.expiryDate}T00:00:00.000Z` : undefined,
        })),
      };

      const result = await createMutation.mutateAsync(payload);
      toast.success(
        `Nota belanja berhasil dicatat! Menambah ${result.batches.length} batch stok baru.`
      );
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Gagal menyimpan nota belanja. Periksa isian form."
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <PurchaseModalHeader onClose={onClose} />

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <PurchaseInvoiceFields register={register} errors={errors} todayStr={todayStr} />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Daftar Bahan yang Dibeli ({fields.length} Item)
                </h4>
              </div>
              <button
                type="button"
                onClick={() =>
                  append({
                    ingredientId: activeIngredients[0]?.id || "",
                    purchaseUnit: activeIngredients[0]?.baseUnit || "G",
                    purchaseQty: 1,
                    purchaseUnitPrice: 10000,
                    expiryDate: "",
                  })
                }
                disabled={activeIngredients.length === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-200 transition-all disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris</span>
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <PurchaseLineItem
                  key={field.id}
                  index={index}
                  fieldId={field.id}
                  activeIngredients={activeIngredients}
                  register={register}
                  watchedItem={watchedItems?.[index]}
                  todayStr={todayStr}
                  canRemove={fields.length > 1}
                  onRemove={() => remove(index)}
                  onIngredientChange={(id) => handleIngredientChange(index, id)}
                />
              ))}
            </div>
          </div>

          <PurchaseModalFooter
            totalAmount={totalAmount}
            onCancel={onClose}
            isPending={createMutation.isPending}
            canSubmit={activeIngredients.length > 0}
          />
        </form>
      </div>
    </div>
  );
}

export default PurchaseModal;
