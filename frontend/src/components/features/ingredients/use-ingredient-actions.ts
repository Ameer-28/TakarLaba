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
          toast.warning("Ingredient saved, but additional purchase unit could not be added.");
        }
      }
      toast.success(`Ingredient "${created.name}" added successfully.`);
      setIsCreateOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add ingredient.");
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
      toast.success(`Ingredient "${values.name}" updated successfully.`);
      setEditingIngredient(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update ingredient.");
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
      toast.success(`Unit "${values.name}" added successfully.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add purchase unit.");
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
      toast.success(`Unit "${unitName}" removed successfully.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove purchase unit.");
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingIngredient) return;
    try {
      await deleteMutation.mutateAsync(deactivatingIngredient.id);
      toast.success(`Ingredient "${deactivatingIngredient.name}" deactivated successfully.`);
      setDeactivatingIngredient(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to deactivate ingredient.");
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
