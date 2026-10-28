import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
  useAddPurchaseUnit,
  useDeletePurchaseUnit,
  type Ingredient,
} from "@/api/hooks/use-ingredients";
import { ApiError } from "@/api/client";
import type { IngredientFormValues, PurchaseUnitFormValues } from "./types";

export function useIngredientActions() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [managingUnitsIngredient, setManagingUnitsIngredient] = useState<Ingredient | null>(null);
  const [deactivatingIngredient, setDeactivatingIngredient] = useState<Ingredient | null>(null);

  const createMutation = useCreateIngredient();
  const updateMutation = useUpdateIngredient();
  const deleteMutation = useDeleteIngredient();
  const addUnitMutation = useAddPurchaseUnit();
  const deleteUnitMutation = useDeletePurchaseUnit();

  const handleCreate = async (values: IngredientFormValues) => {
    try {
      const created = await createMutation.mutateAsync({
        name: values.name,
        category: values.category,
        baseUnit: values.baseUnit,
        yieldPercent: Number(values.yieldPercent),
        minStockBase: Number(values.minStockBase),
        isPerishable: values.isPerishable,
      });
      if (
        values.purchaseUnitName?.trim() &&
        values.purchaseUnitFactor &&
        values.purchaseUnitFactor > 0
      ) {
        try {
          await addUnitMutation.mutateAsync({
            ingredientId: created.id,
            data: {
              name: values.purchaseUnitName.trim(),
              toBaseFactor: Number(values.purchaseUnitFactor),
            },
          });
        } catch {
          toast.warning("Bahan tersimpan, tetapi satuan tambahan gagal ditambahkan.");
        }
      }
      toast.success(`Bahan "${created.name}" berhasil ditambahkan.`);
      setIsCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menambahkan bahan baku.");
    }
  };

  const handleUpdate = async (values: IngredientFormValues) => {
    if (!editingIngredient) return;
    try {
      await updateMutation.mutateAsync({
        id: editingIngredient.id,
        data: {
          name: values.name,
          category: values.category,
          yieldPercent: Number(values.yieldPercent),
          minStockBase: Number(values.minStockBase),
          isPerishable: values.isPerishable,
        },
      });
      toast.success(`Data "${values.name}" berhasil diperbarui.`);
      setEditingIngredient(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal memperbarui data bahan baku.");
    }
  };

  const handleAddUnit = async (values: PurchaseUnitFormValues) => {
    if (!managingUnitsIngredient) return;
    try {
      const created = await addUnitMutation.mutateAsync({
        ingredientId: managingUnitsIngredient.id,
        data: {
          name: values.name,
          toBaseFactor: Number(values.toBaseFactor),
        },
      });
      setManagingUnitsIngredient({
        ...managingUnitsIngredient,
        units: [...managingUnitsIngredient.units, created],
      });
      toast.success(`Satuan "${values.name}" berhasil ditambahkan.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menambahkan satuan beli.");
    }
  };

  const handleDeleteUnit = async (unitId: string, unitName: string) => {
    if (!managingUnitsIngredient) return;
    try {
      await deleteUnitMutation.mutateAsync({ ingredientId: managingUnitsIngredient.id, unitId });
      setManagingUnitsIngredient({
        ...managingUnitsIngredient,
        units: managingUnitsIngredient.units.filter((u) => u.id !== unitId),
      });
      toast.success(`Satuan "${unitName}" berhasil dihapus.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menghapus satuan beli.");
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingIngredient) return;
    try {
      await deleteMutation.mutateAsync(deactivatingIngredient.id);
      toast.success(`Bahan "${deactivatingIngredient.name}" berhasil dinonaktifkan.`);
      setDeactivatingIngredient(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Gagal menonaktifkan bahan.");
    }
  };

  return {
    isCreateOpen,
    setIsCreateOpen,
    isPurchaseModalOpen,
    setIsPurchaseModalOpen,
    editingIngredient,
    setEditingIngredient,
    managingUnitsIngredient,
    setManagingUnitsIngredient,
    deactivatingIngredient,
    setDeactivatingIngredient,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isAddingUnit: addUnitMutation.isPending,
    isDeactivating: deleteMutation.isPending,
    handleCreate,
    handleUpdate,
    handleAddUnit,
    handleDeleteUnit,
    handleDeactivate,
  };
}
